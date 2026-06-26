import { spawn } from 'node:child_process';

type LogFn = (message: string) => Promise<void> | void;

type BuildAndPushInput = {
  repoUrl: string;
  branch: string;
  repoName: string;
  tag: string;
  onLog?: LogFn;
};

type BuildAndPushResult = {
  imageRef: string;
  pushed: boolean;
  simulated: boolean;
};

const emitLog = async (onLog: LogFn | undefined, message: string) => {
  console.log(message);
  if (onLog) {
    await onLog(message);
  }
};

const runCommand = async (
  command: string,
  args: string[],
  onLog?: LogFn
): Promise<void> => {
  await emitLog(onLog, `$ ${command} ${args.join(' ')}`);

  await new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: false,
    });

    child.stdout.on('data', async (chunk) => {
      const text = chunk.toString().trim();
      if (text) {
        await emitLog(onLog, text);
      }
    });

    child.stderr.on('data', async (chunk) => {
      const text = chunk.toString().trim();
      if (text) {
        await emitLog(onLog, text);
      }
    });

    child.on('error', (error) => {
      reject(error);
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${command} exited with code ${code}`));
      }
    });
  });
};

const normalizeRepoName = (repoName: string) => {
  return repoName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

const normalizeRepoUrlForDocker = (repoUrl: string) => {
  const trimmed = repoUrl.trim();

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed.endsWith('.git') ? trimmed : `${trimmed}.git`;
  }

  return trimmed;
};

const buildGitContext = (repoUrl: string, branch: string) => {
  const normalizedUrl = normalizeRepoUrlForDocker(repoUrl);
  return `${normalizedUrl}#${branch}`;
};

const buildImageRef = (repoName: string, tag: string) => {
  const normalizedName = normalizeRepoName(repoName);
  const registry = process.env.DOCKER_REGISTRY?.trim();
  const namespace = process.env.DOCKER_IMAGE_NAMESPACE?.trim();

  let imageName = normalizedName;

  if (namespace) {
    imageName = `${namespace}/${imageName}`;
  }

  if (registry) {
    imageName = `${registry}/${imageName}`;
  }

  return `${imageName}:${tag}`;
};

const isDockerEnabled = () => process.env.DOCKER_ENABLED === 'true';
const isDockerPushEnabled = () => process.env.DOCKER_PUSH_ENABLED === 'true';

export const dockerService = {
  async ensureDockerAvailable(onLog?: LogFn) {
    await runCommand('docker', ['version', '--format', '{{.Server.Version}}'], onLog);
  },

  async buildImage(
    repoUrl: string,
    branch: string,
    imageRef: string,
    onLog?: LogFn
  ) {
    const context = buildGitContext(repoUrl, branch);

    await emitLog(onLog, `Building Docker image from ${context}`);
    await runCommand('docker', ['build', '-t', imageRef, context], onLog);
  },

  async pushImage(imageRef: string, onLog?: LogFn) {
    await emitLog(onLog, `Pushing Docker image ${imageRef}`);
    await runCommand('docker', ['push', imageRef], onLog);
  },

  async buildAndMaybePush({
    repoUrl,
    branch,
    repoName,
    tag,
    onLog,
  }: BuildAndPushInput): Promise<BuildAndPushResult> {
    const imageRef = buildImageRef(repoName, tag);

    if (!isDockerEnabled()) {
      await emitLog(
        onLog,
        `DOCKER_ENABLED=false, simulating Docker build for ${imageRef}`
      );

      return {
        imageRef,
        pushed: false,
        simulated: true,
      };
    }

    await this.ensureDockerAvailable(onLog);
    await this.buildImage(repoUrl, branch, imageRef, onLog);

    let pushed = false;

    if (isDockerPushEnabled()) {
      await this.pushImage(imageRef, onLog);
      pushed = true;
    } else {
      await emitLog(onLog, 'DOCKER_PUSH_ENABLED=false, skipping docker push');
    }

    return {
      imageRef,
      pushed,
      simulated: false,
    };
  },
};