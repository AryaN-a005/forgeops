import { prisma } from '../lib/prisma.js';
import { ApiError } from '../middleware/errorHandler.js';
import { EnvironmentType } from '../generated/prisma/client';
import { auditLogService } from './auditLogService.js';

export const environmentService = {
  /**
   * Create a new environment
   */
  async create(
    projectId: string,
    name: string,
    type: EnvironmentType,
    actorUserId: string
  ) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true },
    });

    if (!project) {
      throw new ApiError(404, 'Project not found', 'PROJECT_NOT_FOUND');
    }

    const existing = await prisma.environment.findFirst({
      where: {
        projectId,
        name,
      },
    });

    if (existing) {
      throw new ApiError(
        409,
        'Environment with this name already exists in project',
        'ENV_NAME_EXISTS'
      );
    }

    const environment = await prisma.environment.create({
      data: {
        projectId,
        name,
        type,
      },
    });

    await auditLogService.logSafe({
      userId: actorUserId,
      action: 'ENVIRONMENT_CREATED',
      resource: 'ENVIRONMENT',
      resourceId: environment.id,
      details: {
        projectId: environment.projectId,
        name: environment.name,
        type: environment.type,
      },
    });

    return environment;
  },

  /**
   * Get all environments for a project
   */
  async getByProject(projectId: string) {
    return prisma.environment.findMany({
      where: { projectId },
      include: {
        deployments: true,
        variables: true,
        secrets: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  },

  /**
   * Get environment by ID
   */
  async getById(id: string) {
    const env = await prisma.environment.findUnique({
      where: { id },
      include: {
        project: true,
        deployments: true,
        secrets: true,
        variables: true,
      },
    });

    if (!env) {
      throw new ApiError(404, 'Environment not found', 'ENV_NOT_FOUND');
    }

    return env;
  },

  /**
   * Update environment
   */
  async update(
    id: string,
    data: { name?: string; type?: EnvironmentType },
    actorUserId: string
  ) {
    try {
      const environment = await prisma.environment.update({
        where: { id },
        data,
      });

      await auditLogService.logSafe({
        userId: actorUserId,
        action: 'ENVIRONMENT_UPDATED',
        resource: 'ENVIRONMENT',
        resourceId: environment.id,
        details: data,
      });

      return environment;
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new ApiError(404, 'Environment not found', 'ENV_NOT_FOUND');
      }

      if (error.code === 'P2002') {
        throw new ApiError(
          409,
          'Environment with this name already exists in project',
          'ENV_NAME_EXISTS'
        );
      }

      throw error;
    }
  },

  /**
   * Delete environment
   */
  async delete(id: string, actorUserId: string) {
    try {
      const environment = await prisma.environment.delete({
        where: { id },
      });

      await auditLogService.logSafe({
        userId: actorUserId,
        action: 'ENVIRONMENT_DELETED',
        resource: 'ENVIRONMENT',
        resourceId: environment.id,
        details: {
          projectId: environment.projectId,
          name: environment.name,
          type: environment.type,
        },
      });

      return environment;
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new ApiError(404, 'Environment not found', 'ENV_NOT_FOUND');
      }

      throw error;
    }
  },
};