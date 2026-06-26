import type { Request, Response } from 'express';
import { EnvironmentType } from '../generated/prisma/client';
import { asyncHandler } from '../middleware/errorHandler.js';
import { environmentService } from '../services/environmentService.js';
import type { RequestWithUser } from '../types/index.js';

export const environmentController = {
  create: asyncHandler(async (req: Request & RequestWithUser, res: Response) => {
    const { projectId, name, type } = req.body;

    const env = await environmentService.create(
      projectId,
      name,
      type as EnvironmentType,
      req.user!.id
    );

    res.status(201).json({
      success: true,
      data: env,
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

      const envs = await environmentService.getByProject(projectId);

      res.json({
        success: true,
        data: envs,
      });
    }
  ),

  getById: asyncHandler(async (req: Request & RequestWithUser, res: Response) => {
    const env = await environmentService.getById(req.params.id);

    res.json({
      success: true,
      data: env,
    });
  }),

  update: asyncHandler(async (req: Request & RequestWithUser, res: Response) => {
    const { name, type } = req.body;

    const env = await environmentService.update(
      req.params.id,
      {
        name,
        type: type as EnvironmentType,
      },
      req.user!.id
    );

    res.json({
      success: true,
      data: env,
    });
  }),

  delete: asyncHandler(async (req: Request & RequestWithUser, res: Response) => {
    await environmentService.delete(req.params.id, req.user!.id);

    res.json({
      success: true,
      message: 'Environment deleted',
    });
  }),
};