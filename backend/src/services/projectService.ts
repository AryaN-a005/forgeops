import { prisma } from '../lib/prisma.js';
import { ApiError } from '../middleware/errorHandler.js';
import { auditLogService } from './auditLogService.js';

export const projectService = {
  /**
   * Create a new project
   */
  async create(
    name: string,
    organizationId: string,
    createdById: string,
    description?: string
  ) {
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
    });

    if (!organization) {
      throw new ApiError(404, 'Organization not found', 'ORG_NOT_FOUND');
    }

    const project = await prisma.project.create({
      data: {
        name,
        description,
        organizationId,
        createdById,
      },
    });

    await auditLogService.logSafe({
      userId: createdById,
      action: 'PROJECT_CREATED',
      resource: 'PROJECT',
      resourceId: project.id,
      details: {
        name: project.name,
        organizationId: project.organizationId,
        description: project.description,
      },
    });

    return project;
  },

  /**
   * Get all projects for an organization
   */
  async getByOrganization(organizationId: string) {
    return prisma.project.findMany({
      where: { organizationId },
      include: {
        repository: true,
        environments: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  },

  /**
   * Get project by ID
   */
  async getById(id: string) {
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        repository: true,
        environments: true,
        deployments: true,
        organization: true,
        createdBy: true,
      },
    });

    if (!project) {
      throw new ApiError(404, 'Project not found', 'PROJECT_NOT_FOUND');
    }

    return project;
  },

  /**
   * Update project
   */
  async update(
    id: string,
    data: { name?: string; description?: string },
    actorUserId: string
  ) {
    try {
      const project = await prisma.project.update({
        where: { id },
        data,
      });

      await auditLogService.logSafe({
        userId: actorUserId,
        action: 'PROJECT_UPDATED',
        resource: 'PROJECT',
        resourceId: project.id,
        details: data,
      });

      return project;
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new ApiError(404, 'Project not found', 'PROJECT_NOT_FOUND');
      }
      throw error;
    }
  },

  /**
   * Delete project
   */
  async delete(id: string, actorUserId: string) {
    try {
      const project = await prisma.project.delete({
        where: { id },
      });

      await auditLogService.logSafe({
        userId: actorUserId,
        action: 'PROJECT_DELETED',
        resource: 'PROJECT',
        resourceId: project.id,
        details: {
          name: project.name,
          organizationId: project.organizationId,
        },
      });

      return project;
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new ApiError(404, 'Project not found', 'PROJECT_NOT_FOUND');
      }
      throw error;
    }
  },
};