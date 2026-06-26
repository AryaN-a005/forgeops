import { DeploymentStatus } from '../generated/prisma/client';
import { prisma } from '../lib/prisma.js';
import { ApiError } from '../middleware/errorHandler.js';
import { auditLogService } from './auditLogService.js';
import { enqueueDeploymentJob } from '../queues/deploymentQueue.js';

type CreateDeploymentInput = {
  projectId: string;
  environmentId: string;
  imageTag: string;
  commitSha: string;
  deployedById: string;
  clusterId?: string;
  namespaceId?: string;
};

export const deploymentService = {
  async create({
    projectId,
    environmentId,
    imageTag,
    commitSha,
    deployedById,
    clusterId,
    namespaceId,
  }: CreateDeploymentInput) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        organizationId: true,
      },
    });

    if (!project) {
      throw new ApiError(404, 'Project not found', 'PROJECT_NOT_FOUND');
    }

    const environment = await prisma.environment.findUnique({
      where: { id: environmentId },
      select: {
        id: true,
        projectId: true,
      },
    });

    if (!environment) {
      throw new ApiError(404, 'Environment not found', 'ENV_NOT_FOUND');
    }

    if (environment.projectId !== projectId) {
      throw new ApiError(
        400,
        'Environment does not belong to the specified project',
        'ENV_PROJECT_MISMATCH'
      );
    }

    if ((clusterId && !namespaceId) || (!clusterId && namespaceId)) {
      throw new ApiError(
        400,
        'clusterId and namespaceId must be provided together',
        'CLUSTER_NAMESPACE_PAIR_REQUIRED'
      );
    }

    if (clusterId) {
      const cluster = await prisma.cluster.findUnique({
        where: { id: clusterId },
        select: { id: true },
      });

      if (!cluster) {
        throw new ApiError(404, 'Cluster not found', 'CLUSTER_NOT_FOUND');
      }
    }

    if (namespaceId) {
      const namespace = await prisma.namespace.findUnique({
        where: { id: namespaceId },
        select: {
          id: true,
          projectId: true,
          clusterId: true,
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

      if (clusterId && namespace.clusterId !== clusterId) {
        throw new ApiError(
          400,
          'Namespace does not belong to the specified cluster',
          'NAMESPACE_CLUSTER_MISMATCH'
        );
      }
    }

    const deployment = await prisma.deployment.create({
      data: {
        projectId,
        environmentId,
        clusterId: clusterId ?? null,
        namespaceId: namespaceId ?? null,
        imageTag,
        commitSha,
        deployedById,
        status: DeploymentStatus.PENDING,
      },
      include: {
        project: true,
        environment: true,
        deployedBy: true,
        cluster: true,
        namespace: true,
      },
    });

    await auditLogService.logSafe({
      userId: deployedById,
      action: 'DEPLOYMENT_TRIGGERED',
      resource: 'DEPLOYMENT',
      resourceId: deployment.id,
      details: {
        projectId: deployment.projectId,
        environmentId: deployment.environmentId,
        clusterId: deployment.clusterId,
        namespaceId: deployment.namespaceId,
        imageTag: deployment.imageTag,
        commitSha: deployment.commitSha,
        status: deployment.status,
      },
    });

    try {
      await enqueueDeploymentJob({
        deploymentId: deployment.id,
      });
    } catch (error) {
      console.error('Failed to enqueue deployment job:', error);

      return prisma.deployment.update({
        where: { id: deployment.id },
        data: {
          status: DeploymentStatus.FAILED,
        },
        include: {
          project: true,
          environment: true,
          deployedBy: true,
          cluster: true,
          namespace: true,
        },
      });
    }

    return deployment;
  },

  async getByProject(projectId: string) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true },
    });

    if (!project) {
      throw new ApiError(404, 'Project not found', 'PROJECT_NOT_FOUND');
    }

    return prisma.deployment.findMany({
      where: { projectId },
      include: {
        environment: true,
        deployedBy: true,
        cluster: true,
        namespace: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  },

  async getById(id: string) {
    const deployment = await prisma.deployment.findUnique({
      where: { id },
      include: {
        project: {
          include: {
            organization: true,
          },
        },
        environment: true,
        deployedBy: true,
        cluster: true,
        namespace: true,
        metrics: true,
        logs: true,
      },
    });

    if (!deployment) {
      throw new ApiError(404, 'Deployment not found', 'DEPLOYMENT_NOT_FOUND');
    }

    return deployment;
  },
};