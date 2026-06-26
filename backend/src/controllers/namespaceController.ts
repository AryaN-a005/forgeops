import type { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { namespaceService } from '../services/namespaceService.js';
import type { RequestWithUser } from '../types/index.js';

export const namespaceController = {
  create: asyncHandler(async (req: Request & RequestWithUser, res: Response) => {
    const { clusterId, projectId, name } = req.body;

    const namespace = await namespaceService.create({
      clusterId,
      projectId,
      name,
      actorUserId: req.user!.id,
    });

    res.status(201).json({
      success: true,
      data: namespace,
    });
  }),

  getByProject: asyncHandler(async (req: Request, res: Response) => {
    const { projectId } = req.query;

    if (!projectId || typeof projectId !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'projectId query parameter is required',
      });
    }

    const namespaces = await namespaceService.getByProject(projectId);

    res.json({
      success: true,
      data: namespaces,
    });
  }),
};