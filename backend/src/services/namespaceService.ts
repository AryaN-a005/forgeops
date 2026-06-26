import { prisma } from '../lib/prisma.js';
import { ApiError } from '../middleware/errorHandler.js';
import { auditLogService } from './auditLogService.js';
import { kubernetesService } from './kubernetesService.js';

type CreateNamespaceInput = {
  clusterId: string;
  projectId: string;
  name: string;
  actorUserId: string;
};

export const namespaceService = {
  async create({
    clusterId,
    projectId,
    name,
    actorUserId,
  }: CreateNamespaceInput) {
    const cluster = await prisma.cluster.findUnique({
      where: { id: clusterId },
      select: { id: true },
    });

    if (!cluster) {
      throw new ApiError(404, 'Cluster not found', 'CLUSTER_NOT_FOUND');
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true },
    });

    if (!project) {
      throw new ApiError(404, 'Project not found', 'PROJECT_NOT_FOUND');
    }

    const existing = await prisma.namespace.findFirst({
      where: {
        clusterId,
        projectId,
        name,
      },
      select: { id: true },
    });

    if (existing) {
      throw new ApiError(
        409,
        'Namespace already exists for this project in this cluster',
        'NAMESPACE_EXISTS'
      );
    }

    await kubernetesService.ensureNamespaceExists(clusterId, name);

    const namespace = await prisma.namespace.create({
      data: {
        clusterId,
        projectId,
        name,
      },
    });

    await auditLogService.logSafe({
      userId: actorUserId,
      action: 'NAMESPACE_CREATED',
      resource: 'NAMESPACE',
      resourceId: namespace.id,
      details: {
        clusterId: namespace.clusterId,
        projectId: namespace.projectId,
        name: namespace.name,
      },
    });

    return namespace;
  },

  async getByProject(projectId: string) {
    return prisma.namespace.findMany({
      where: { projectId },
      include: {
        cluster: {
          select: {
            id: true,
            name: true,
            provider: true,
            region: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  },
};