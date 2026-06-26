import { prisma } from '../lib/prisma.js';
import { ApiError } from '../middleware/errorHandler.js';
import { auditLogService } from './auditLogService.js';
import {
  kubernetesService,
  sanitizeKubernetesName,
} from './kubernetesService.js';

const getNamespaceForProjectAndCluster = async (
  clusterId: string,
  projectId: string,
  namespaceId: string
) => {
  const namespace = await prisma.namespace.findUnique({
    where: { id: namespaceId },
    include: {
      cluster: true,
      project: true,
    },
  });

  if (!namespace) {
    throw new ApiError(404, 'Namespace not found', 'NAMESPACE_NOT_FOUND');
  }

  if (namespace.projectId !== projectId) {
    throw new ApiError(
      400,
      'Namespace does not belong to the specified project',
      'NAMESPACE_PROJECT_MISMATCH'
    );
  }

  if (namespace.clusterId !== clusterId) {
    throw new ApiError(
      400,
      'Namespace does not belong to the specified cluster',
      'NAMESPACE_CLUSTER_MISMATCH'
    );
  }

  return namespace;
};

export const exposureService = {
  async exposeService({
    clusterId,
    projectId,
    deploymentId,
    serviceName,
    port,
    targetPort,
    type,
    actorUserId,
  }: {
    clusterId: string;
    projectId: string;
    deploymentId: string;
    serviceName: string;
    port: number;
    targetPort: number;
    type: 'ClusterIP' | 'NodePort' | 'LoadBalancer';
    actorUserId: string;
  }) {
    const deployment = await prisma.deployment.findUnique({
      where: { id: deploymentId },
      include: {
        project: true,
        environment: true,
        cluster: true,
        namespace: true,
      },
    });

    if (!deployment) {
      throw new ApiError(404, 'Deployment not found', 'DEPLOYMENT_NOT_FOUND');
    }

    if (deployment.projectId !== projectId) {
      throw new ApiError(
        400,
        'Deployment does not belong to the specified project',
        'DEPLOYMENT_PROJECT_MISMATCH'
      );
    }

    if (!deployment.clusterId || deployment.clusterId !== clusterId) {
      throw new ApiError(
        400,
        'Deployment does not belong to the specified cluster',
        'DEPLOYMENT_CLUSTER_MISMATCH'
      );
    }

    if (!deployment.namespace) {
      throw new ApiError(
        400,
        'Deployment is not associated with a namespace',
        'DEPLOYMENT_NAMESPACE_REQUIRED'
      );
    }

    const appName = sanitizeKubernetesName(
      `${deployment.project.name}-${deployment.environment.name}`
    );

    const result = await kubernetesService.exposeService({
      clusterId,
      namespaceName: deployment.namespace.name,
      serviceName,
      appName,
      port,
      targetPort,
      type,
    });

    await auditLogService.logSafe({
      userId: actorUserId,
      action: 'SERVICE_EXPOSED',
      resource: 'SERVICE',
      resourceId: result.serviceName,
      details: {
        clusterId,
        projectId,
        deploymentId,
        namespace: result.namespace,
        serviceName: result.serviceName,
        appName: result.appName,
        port: result.port,
        targetPort: result.targetPort,
        type: result.type,
      },
    });

    return result;
  },

  async getServices({
    clusterId,
    projectId,
    namespaceId,
  }: {
    clusterId: string;
    projectId: string;
    namespaceId: string;
  }) {
    const namespace = await getNamespaceForProjectAndCluster(
      clusterId,
      projectId,
      namespaceId
    );

    const raw = await kubernetesService.getServices(clusterId, namespace.name);

    return (raw.items ?? []).map((item: any) => ({
      name: item.metadata?.name,
      namespace: item.metadata?.namespace,
      type: item.spec?.type,
      clusterIP: item.spec?.clusterIP ?? null,
      externalIPs: item.spec?.externalIPs ?? [],
      ports: (item.spec?.ports ?? []).map((port: any) => ({
        name: port.name ?? null,
        protocol: port.protocol,
        port: port.port,
        targetPort: port.targetPort,
        nodePort: port.nodePort ?? null,
      })),
      selector: item.spec?.selector ?? {},
    }));
  },

  async exposeIngress({
    clusterId,
    projectId,
    namespaceId,
    ingressName,
    serviceName,
    host,
    path,
    servicePort,
    pathType,
    ingressClassName,
    actorUserId,
  }: {
    clusterId: string;
    projectId: string;
    namespaceId: string;
    ingressName: string;
    serviceName: string;
    host: string;
    path?: string;
    servicePort?: number;
    pathType?: 'Prefix' | 'Exact' | 'ImplementationSpecific';
    ingressClassName?: string;
    actorUserId: string;
  }) {
    const namespace = await getNamespaceForProjectAndCluster(
      clusterId,
      projectId,
      namespaceId
    );

    const result = await kubernetesService.exposeIngress({
      clusterId,
      namespaceName: namespace.name,
      ingressName,
      serviceName,
      host,
      path,
      servicePort,
      pathType,
      ingressClassName,
    });

    await auditLogService.logSafe({
      userId: actorUserId,
      action: 'INGRESS_EXPOSED',
      resource: 'INGRESS',
      resourceId: result.ingressName,
      details: {
        clusterId,
        projectId,
        namespaceId,
        namespace: result.namespace,
        ingressName: result.ingressName,
        serviceName: result.serviceName,
        host: result.host,
        path: result.path,
        servicePort: result.servicePort,
        pathType: result.pathType,
        ingressClassName: result.ingressClassName,
      },
    });

    return result;
  },

  async getIngresses({
    clusterId,
    projectId,
    namespaceId,
  }: {
    clusterId: string;
    projectId: string;
    namespaceId: string;
  }) {
    const namespace = await getNamespaceForProjectAndCluster(
      clusterId,
      projectId,
      namespaceId
    );

    const raw = await kubernetesService.getIngresses(clusterId, namespace.name);

    return (raw.items ?? []).map((item: any) => ({
      name: item.metadata?.name,
      namespace: item.metadata?.namespace,
      ingressClassName: item.spec?.ingressClassName ?? null,
      hosts:
        (item.spec?.rules ?? []).map((rule: any) => ({
          host: rule.host ?? null,
          paths:
            (rule.http?.paths ?? []).map((path: any) => ({
              path: path.path,
              pathType: path.pathType,
              serviceName: path.backend?.service?.name ?? null,
              servicePort:
                path.backend?.service?.port?.number ??
                path.backend?.service?.port?.name ??
                null,
            })) ?? [],
        })) ?? [],
      addresses:
        (item.status?.loadBalancer?.ingress ?? []).map((ing: any) => ({
          ip: ing.ip ?? null,
          hostname: ing.hostname ?? null,
        })) ?? [],
    }));
  },
};