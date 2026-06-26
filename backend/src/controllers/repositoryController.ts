import type { Request, Response } from 'express';
import { GitProvider } from '../generated/prisma/client';
import { asyncHandler } from '../middleware/errorHandler.js';
import { repositoryService } from '../services/repositoryService.js';
import type { RequestWithUser } from '../types/index.js';

export const repositoryController = {
  create: asyncHandler(async (req: Request & RequestWithUser, res: Response) => {
    const { projectId, provider, repoUrl, repoName, defaultBranch } = req.body;

    const repository = await repositoryService.create({
      projectId,
      provider: provider as GitProvider,
      repoUrl,
      repoName,
      defaultBranch,
      connectedById: req.user!.id,
    });

    res.status(201).json({
      success: true,
      data: repository,
    });
  }),

  getByProject: asyncHandler(
    async (req: Request & RequestWithUser, res: Response) => {
      const { projectId } = req.query;

      if (!projectId || typeof projectId !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'projectId query parameter is required',
        });
      }

      const repository = await repositoryService.getByProject(projectId);

      res.json({
        success: true,
        data: repository,
      });
    }
  ),

  getById: asyncHandler(async (req: Request & RequestWithUser, res: Response) => {
    const repository = await repositoryService.getById(req.params.id);

    res.json({
      success: true,
      data: repository,
    });
  }),
};