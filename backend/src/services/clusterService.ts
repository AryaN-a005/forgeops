import { prisma } from '../lib/prisma.js';
import { ApiError } from '../middleware/errorHandler.js';
import { ClusterProvider } from '../generated/prisma/client';
import { auditLogService } from './auditLogService.js';

type CreateClusterInput = {
  name: string;
  provider: ClusterProvider;
  region: string;
  kubeConfig: string;
  actorUserId: string;
};

export const clusterService = {
  async create({
    name,
    provider,
    region,
    kubeConfig,
    actorUserId,
  }: CreateClusterInput) {
    const existing = await prisma.cluster.findFirst({
      where: { name },
      select: { id: true },
    });

    if (existing) {
      throw new ApiError(409, 'Cluster with this name already exists', 'CLUSTER_NAME_EXISTS');
    }

    const cluster = await prisma.cluster.create({
      data: {
        name,
        provider,
        region,
        kubeConfig,
      },
    });

    await auditLogService.logSafe({
      userId: actorUserId,
      action: 'CLUSTER_CREATED',
      resource: 'CLUSTER',
      resourceId: cluster.id,
      details: {
        name: cluster.name,
        provider: cluster.provider,
        region: cluster.region,
      },
    });

    return cluster;
  },

  async getAll() {
    return prisma.cluster.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        provider: true,
        region: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  },

  async getById(id: string) {
    const cluster = await prisma.cluster.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        provider: true,
        region: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!cluster) {
      throw new ApiError(404, 'Cluster not found', 'CLUSTER_NOT_FOUND');
    }

    return cluster;
  },
};