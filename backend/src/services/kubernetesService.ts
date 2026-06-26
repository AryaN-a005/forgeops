import { promises as fs } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { spawn } from 'node:child_process';
import { prisma } from '../lib/prisma.js';
import { ApiError } from '../middleware/errorHandler.js';

type LogFn = (message: string) => Promise<void> | void;

type DeployToKubernetesInput = {
  clusterId: string;
  namespaceName: string;
  deploymentName: string;
  imageRef: string;
  replicas?: number;
  onLog?: LogFn;
};

type RestartDeploymentInput = {
  clusterId: string;
  namespaceName: string;
  deploymentName: string;
  onLog?: LogFn;
};

type RollbackDeploymentInput = {
  clusterId: string;
  namespaceName: string;
  deploymentName: string;
  toRevision?: number;
  onLog?: LogFn;
};

const emitLog = async (onLog: LogFn | undefined, message: string) => {
  console.log(message);
  if (onLog) {
    await onLog(message);
  }
};

export const sanitizeKubernetesName = (value: string) => {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50);
};

const runCommand = async (
  command: string,
  args: string[],
  onLog?: LogFn,
  stdinPayload?: string
) => {
  await emitLog(onLog, `$ ${command} ${args.join(' ')}`);

  return new Promise<string>((resolve, reject) => {
    const stdoutChunks: string[] = [];
    const stderrChunks: string[] = [];

    const child = spawn(command, args, {
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: false,
    });

    child.stdout.on('data', async (chunk) => {
      const text = chunk.toString();
      stdoutChunks.push(text);

      const trimmed = text.trim();
      if (trimmed) {
        await emitLog(onLog, trimmed);
      }
    });

    child.stderr.on('data', async (chunk) => {
      const text = chunk.toString();
      stderrChunks.push(text);

      const trimmed = text.trim();
      if (trimmed) {
        await emitLog(onLog, trimmed);
      }
    });

    child.on('error', (error: any) => {
      if (error?.code === 'ENOENT') {
        reject(new Error(`Executable not found in $PATH: "${command}"`));
        return;
      }
      reject(error);
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve(stdoutChunks.join(''));
      } else {
        const stderr = stderrChunks.join('').trim();
        reject(new Error(stderr || `${command} exited with code ${code}`));
      }
    });

    if (stdinPayload) {
      child.stdin.write(stdinPayload);
    }
    child.stdin.end();
  });
};

const withKubeconfig = async <T>(
  clusterId: string,
  fn: (kubeconfigPath: string) => Promise<T>
): Promise<T> => {
  const cluster = await prisma.cluster.findUnique({
    where: { id: clusterId },
    select: {
      id: true,
      kubeConfig: true,
    },
  });

  if (!cluster) {
    throw new ApiError(404, 'Cluster not found', 'CLUSTER_NOT_FOUND');
  }

  const filePath = path.join(
    tmpdir(),
    `forgeops-kubeconfig-${cluster.id}-${randomUUID()}.yaml`
  );

  await fs.writeFile(filePath, cluster.kubeConfig, 'utf8');

  try {
    return await fn(filePath);
  } finally {
    await fs.unlink(filePath).catch(() => null);
  }
};

const buildDeploymentManifest = ({
  deploymentName,
  namespaceName,
  imageRef,
  replicas,
}: {
  deploymentName: string;
  namespaceName: string;
  imageRef: string;
  replicas: number;
}) => {
  const appName = sanitizeKubernetesName(deploymentName);

  return `apiVersion: apps/v1
kind: Deployment
metadata:
  name: ${appName}
  namespace: ${namespaceName}
  labels:
    app: ${appName}
spec:
  replicas: ${replicas}
  selector:
    matchLabels:
      app: ${appName}
  template:
    metadata:
      labels:
        app: ${appName}
    spec:
      containers:
        - name: app
          image: ${imageRef}
          imagePullPolicy: Always
`;
};

export const kubernetesService = {
  async ensureKubectlAvailable(onLog?: LogFn) {
    await runCommand('kubectl', ['version', '--client'], onLog);
  },

  async ensureNamespaceExists(clusterId: string, namespaceName: string, onLog?: LogFn) {
    const normalizedNamespace = sanitizeKubernetesName(namespaceName);

    await withKubeconfig(clusterId, async (kubeconfigPath) => {
      try {
        await runCommand(
          'kubectl',
          ['--kubeconfig', kubeconfigPath, 'get', 'namespace', normalizedNamespace],
          onLog
        );
      } catch {
        await runCommand(
          'kubectl',
          ['--kubeconfig', kubeconfigPath, 'create', 'namespace', normalizedNamespace],
          onLog
        );
      }
    });
  },

  async deployImage({
    clusterId,
    namespaceName,
    deploymentName,
    imageRef,
    replicas = 1,
    onLog,
  }: DeployToKubernetesInput) {
    const normalizedNamespace = sanitizeKubernetesName(namespaceName);
    const normalizedDeploymentName = sanitizeKubernetesName(deploymentName);
    const manifest = buildDeploymentManifest({
      deploymentName: normalizedDeploymentName,
      namespaceName: normalizedNamespace,
      imageRef,
      replicas,
    });

    await this.ensureKubectlAvailable(onLog);
    await this.ensureNamespaceExists(clusterId, normalizedNamespace, onLog);

    await withKubeconfig(clusterId, async (kubeconfigPath) => {
      await emitLog(
        onLog,
        `Applying deployment ${normalizedDeploymentName} to namespace ${normalizedNamespace}`
      );

      await runCommand(
        'kubectl',
        ['--kubeconfig', kubeconfigPath, 'apply', '-f', '-'],
        onLog,
        manifest
      );

      await runCommand(
        'kubectl',
        [
          '--kubeconfig',
          kubeconfigPath,
          'rollout',
          'status',
          `deployment/${normalizedDeploymentName}`,
          '-n',
          normalizedNamespace,
          '--timeout=120s',
        ],
        onLog
      );
    });

    return {
      namespace: normalizedNamespace,
      deploymentName: normalizedDeploymentName,
      imageRef,
    };
  },

  async restartDeployment({
    clusterId,
    namespaceName,
    deploymentName,
    onLog,
  }: RestartDeploymentInput) {
    const normalizedNamespace = sanitizeKubernetesName(namespaceName);
    const normalizedDeploymentName = sanitizeKubernetesName(deploymentName);

    await this.ensureKubectlAvailable(onLog);

    await withKubeconfig(clusterId, async (kubeconfigPath) => {
      await runCommand(
        'kubectl',
        [
          '--kubeconfig',
          kubeconfigPath,
          'rollout',
          'restart',
          `deployment/${normalizedDeploymentName}`,
          '-n',
          normalizedNamespace,
        ],
        onLog
      );

      await runCommand(
        'kubectl',
        [
          '--kubeconfig',
          kubeconfigPath,
          'rollout',
          'status',
          `deployment/${normalizedDeploymentName}`,
          '-n',
          normalizedNamespace,
          '--timeout=120s',
        ],
        onLog
      );
    });

    return {
      namespace: normalizedNamespace,
      deploymentName: normalizedDeploymentName,
    };
  },

  async rollbackDeployment({
    clusterId,
    namespaceName,
    deploymentName,
    toRevision,
    onLog,
  }: RollbackDeploymentInput) {
    const normalizedNamespace = sanitizeKubernetesName(namespaceName);
    const normalizedDeploymentName = sanitizeKubernetesName(deploymentName);

    await this.ensureKubectlAvailable(onLog);

    await withKubeconfig(clusterId, async (kubeconfigPath) => {
      const args = [
        '--kubeconfig',
        kubeconfigPath,
        'rollout',
        'undo',
        `deployment/${normalizedDeploymentName}`,
        '-n',
        normalizedNamespace,
      ];

      if (toRevision !== undefined) {
        args.push(`--to-revision=${toRevision}`);
      }

      await runCommand('kubectl', args, onLog);

      await runCommand(
        'kubectl',
        [
          '--kubeconfig',
          kubeconfigPath,
          'rollout',
          'status',
          `deployment/${normalizedDeploymentName}`,
          '-n',
          normalizedNamespace,
          '--timeout=120s',
        ],
        onLog
      );
    });

    return {
      namespace: normalizedNamespace,
      deploymentName: normalizedDeploymentName,
      toRevision: toRevision ?? null,
    };
  },

  async getPods(clusterId: string, namespaceName: string, appName?: string) {
    const normalizedNamespace = sanitizeKubernetesName(namespaceName);
    const normalizedAppName = appName ? sanitizeKubernetesName(appName) : undefined;

    return withKubeconfig(clusterId, async (kubeconfigPath) => {
      const args = [
        '--kubeconfig',
        kubeconfigPath,
        'get',
        'pods',
        '-n',
        normalizedNamespace,
        '-o',
        'json',
      ];

      if (normalizedAppName) {
        args.push('-l', `app=${normalizedAppName}`);
      }

      const output = await runCommand('kubectl', args);
      return JSON.parse(output);
    });
  },

  async getPodLogs(
    clusterId: string,
    namespaceName: string,
    podName: string,
    containerName?: string
  ) {
    const normalizedNamespace = sanitizeKubernetesName(namespaceName);

    return withKubeconfig(clusterId, async (kubeconfigPath) => {
      const args = [
        '--kubeconfig',
        kubeconfigPath,
        'logs',
        podName,
        '-n',
        normalizedNamespace,
      ];

      if (containerName) {
        args.push('-c', containerName);
      }

      return runCommand('kubectl', args);
    });
  },
    async exposeService({
    clusterId,
    namespaceName,
    serviceName,
    appName,
    port,
    targetPort,
    type = 'ClusterIP',
    onLog,
  }: {
    clusterId: string;
    namespaceName: string;
    serviceName: string;
    appName: string;
    port: number;
    targetPort: number;
    type?: 'ClusterIP' | 'NodePort' | 'LoadBalancer';
    onLog?: LogFn;
  }) {
    const normalizedNamespace = sanitizeKubernetesName(namespaceName);
    const normalizedServiceName = sanitizeKubernetesName(serviceName);
    const normalizedAppName = sanitizeKubernetesName(appName);

    const manifest = `apiVersion: v1
kind: Service
metadata:
  name: ${normalizedServiceName}
  namespace: ${normalizedNamespace}
spec:
  selector:
    app: ${normalizedAppName}
  ports:
    - protocol: TCP
      port: ${port}
      targetPort: ${targetPort}
  type: ${type}
`;

    await this.ensureKubectlAvailable(onLog);

    await withKubeconfig(clusterId, async (kubeconfigPath) => {
      await runCommand(
        'kubectl',
        ['--kubeconfig', kubeconfigPath, 'apply', '-f', '-'],
        onLog,
        manifest
      );
    });

    return {
      namespace: normalizedNamespace,
      serviceName: normalizedServiceName,
      appName: normalizedAppName,
      port,
      targetPort,
      type,
    };
  },

  async getServices(clusterId: string, namespaceName: string) {
    const normalizedNamespace = sanitizeKubernetesName(namespaceName);

    return withKubeconfig(clusterId, async (kubeconfigPath) => {
      const output = await runCommand('kubectl', [
        '--kubeconfig',
        kubeconfigPath,
        'get',
        'services',
        '-n',
        normalizedNamespace,
        '-o',
        'json',
      ]);

      return JSON.parse(output);
    });
  },

  async exposeIngress({
    clusterId,
    namespaceName,
    ingressName,
    serviceName,
    host,
    path = '/',
    servicePort = 80,
    pathType = 'Prefix',
    ingressClassName,
    onLog,
  }: {
    clusterId: string;
    namespaceName: string;
    ingressName: string;
    serviceName: string;
    host: string;
    path?: string;
    servicePort?: number;
    pathType?: 'Prefix' | 'Exact' | 'ImplementationSpecific';
    ingressClassName?: string;
    onLog?: LogFn;
  }) {
    const normalizedNamespace = sanitizeKubernetesName(namespaceName);
    const normalizedIngressName = sanitizeKubernetesName(ingressName);
    const normalizedServiceName = sanitizeKubernetesName(serviceName);

    const ingressClassBlock = ingressClassName
      ? `  ingressClassName: ${ingressClassName}\n`
      : '';

    const manifest = `apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: ${normalizedIngressName}
  namespace: ${normalizedNamespace}
spec:
${ingressClassBlock}  rules:
    - host: ${host}
      http:
        paths:
          - path: ${path}
            pathType: ${pathType}
            backend:
              service:
                name: ${normalizedServiceName}
                port:
                  number: ${servicePort}
`;

    await this.ensureKubectlAvailable(onLog);

    await withKubeconfig(clusterId, async (kubeconfigPath) => {
      await runCommand(
        'kubectl',
        ['--kubeconfig', kubeconfigPath, 'apply', '-f', '-'],
        onLog,
        manifest
      );
    });

    return {
      namespace: normalizedNamespace,
      ingressName: normalizedIngressName,
      serviceName: normalizedServiceName,
      host,
      path,
      servicePort,
      pathType,
      ingressClassName: ingressClassName ?? null,
    };
  },

  async getIngresses(clusterId: string, namespaceName: string) {
    const normalizedNamespace = sanitizeKubernetesName(namespaceName);

    return withKubeconfig(clusterId, async (kubeconfigPath) => {
      const output = await runCommand('kubectl', [
        '--kubeconfig',
        kubeconfigPath,
        'get',
        'ingress',
        '-n',
        normalizedNamespace,
        '-o',
        'json',
      ]);

      return JSON.parse(output);
    });
  },
};