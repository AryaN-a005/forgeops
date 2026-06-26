import { prisma } from '../lib/prisma.js';
import { encryptSecretValue } from '../lib/encryption.js';
import { ApiError } from '../middleware/errorHandler.js';
import { auditLogService } from './auditLogService.js';

type CreateSecretInput = {
  projectId: string;
  environmentId: string;
  key: string;
  value: string;
  createdById: string;
};

export const secretService = {
  /**
   * Create a new encrypted secret
   */
  async create({
    projectId,
    environmentId,
    key,
    value,
    createdById,
  }: CreateSecretInput) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true },
    });

    if (!project) {
      throw new ApiError(404, 'Project not found', 'PROJECT_NOT_FOUND');
    }

    const environment = await prisma.environment.findUnique({
      where: { id: environmentId },
      select: { id: true, projectId: true },
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

    const existing = await prisma.secret.findUnique({
      where: {
        projectId_environmentId_key: {
          projectId,
          environmentId,
          key,
        },
      },
      select: { id: true },
    });

    if (existing) {
      throw new ApiError(
        409,
        'Secret with this key already exists in the environment',
        'SECRET_KEY_EXISTS'
      );
    }

    const valueEncrypted = encryptSecretValue(value);

    const secret = await prisma.secret.create({
      data: {
        projectId,
        environmentId,
        key,
        valueEncrypted,
        createdById,
      },
      select: {
        id: true,
        projectId: true,
        environmentId: true,
        key: true,
        createdById: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    await auditLogService.logSafe({
      userId: createdById,
      action: 'SECRET_CREATED',
      resource: 'SECRET',
      resourceId: secret.id,
      details: {
        projectId: secret.projectId,
        environmentId: secret.environmentId,
        key: secret.key,
      },
    });

    return secret;
  },

  async getByEnvironment(projectId: string, environmentId: string) {
    const environment = await prisma.environment.findUnique({
      where: { id: environmentId },
      select: { id: true, projectId: true },
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

    return prisma.secret.findMany({
      where: {
        projectId,
        environmentId,
      },
      select: {
        id: true,
        projectId: true,
        environmentId: true,
        key: true,
        createdById: true,
        createdAt: true,
        updatedAt: true,
        createdBy: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  },
};