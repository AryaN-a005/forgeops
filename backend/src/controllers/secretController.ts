import type { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { secretService } from '../services/secretService.js';
import type { RequestWithUser } from '../types/index.js';

export const secretController = {
  create: asyncHandler(async (req: Request & RequestWithUser, res: Response) => {
    const { projectId, environmentId, key, value } = req.body;

    const secret = await secretService.create({
      projectId,
      environmentId,
      key,
      value,
      createdById: req.user!.id,
    });

    res.status(201).json({
      success: true,
      data: secret,
    });
  }),

  getByEnvironment: asyncHandler(
    async (req: Request & RequestWithUser, res: Response) => {
      const { projectId, environmentId } = req.query;

      if (
        !projectId ||
        typeof projectId !== 'string' ||
        !environmentId ||
        typeof environmentId !== 'string'
      ) {
        return res.status(400).json({
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'projectId and environmentId query parameters are required',
        });
      }

      const secrets = await secretService.getByEnvironment(projectId, environmentId);

      res.json({
        success: true,
        data: secrets,
      });
    }
  ),
};