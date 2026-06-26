import { GitProvider } from '../generated/prisma/client';
import { prisma } from '../lib/prisma.js';
import { ApiError } from '../middleware/errorHandler.js';
import { auditLogService } from './auditLogService.js';

type CreateRepositoryInput = {
  projectId: string;
  provider: GitProvider;
  repoUrl: string;
  repoName: string;
  defaultBranch?: string;
  connectedById: string;
};

export const repositoryService = {
  /**
   * Connect a repository to a project
   */
  async create({
    projectId,
    provider,
    repoUrl,
    repoName,
    defaultBranch,
    connectedById,
  }: CreateRepositoryInput) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        repository: true,
      },
    });

    if (!project) {
      throw new ApiError(404, 'Project not found', 'PROJECT_NOT_FOUND');
    }

    if (project.repository) {
      throw new ApiError(
        409,
        'Repository already connected to this project',
        'REPOSITORY_ALREADY_CONNECTED'
      );
    }

    const repository = await prisma.repository.create({
      data: {
        projectId,
        provider,
        repoUrl,
        repoName,
        defaultBranch: defaultBranch || 'main',
      },
      include: {
        project: true,
      },
    });

    await auditLogService.logSafe({
      userId: connectedById,
      action: 'REPOSITORY_CONNECTED',
      resource: 'REPOSITORY',
      resourceId: repository.id,
      details: {
        projectId: repository.projectId,
        provider: repository.provider,
        repoUrl: repository.repoUrl,
        repoName: repository.repoName,
        defaultBranch: repository.defaultBranch,
      },
    });

    return repository;
  },

  async getByProject(projectId: string) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        repository: {
          include: {
            project: true,
          },
        },
      },
    });

    if (!project) {
      throw new ApiError(404, 'Project not found', 'PROJECT_NOT_FOUND');
    }

    if (!project.repository) {
      throw new ApiError(404, 'Repository not found', 'REPOSITORY_NOT_FOUND');
    }

    return project.repository;
  },

  async getById(id: string) {
    const repository = await prisma.repository.findUnique({
      where: { id },
      include: {
        project: {
          include: {
            organization: true,
          },
        },
      },
    });

    if (!repository) {
      throw new ApiError(404, 'Repository not found', 'REPOSITORY_NOT_FOUND');
    }

    return repository;
  },
};