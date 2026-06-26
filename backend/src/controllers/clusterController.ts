import type { Request, Response } from 'express';
import { ClusterProvider } from '../generated/prisma/client';
import { asyncHandler } from '../middleware/errorHandler.js';
import { clusterService } from '../services/clusterService.js';
import type { RequestWithUser } from '../types/index.js';

export const clusterController = {
  create: asyncHandler(async (req: Request & RequestWithUser, res: Response) => {
    const { name, provider, region, kubeConfig } = req.body;

    const cluster = await clusterService.create({
      name,
      provider: provider as ClusterProvider,
      region,
      kubeConfig,
      actorUserId: req.user!.id,
    });

    res.status(201).json({
      success: true,
      data: cluster,
    });
  }),

  getAll: asyncHandler(async (_req: Request, res: Response) => {
    const clusters = await clusterService.getAll();

    res.json({
      success: true,
      data: clusters,
    });
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const cluster = await clusterService.getById(req.params.id);

    res.json({
      success: true,
      data: cluster,
    });
  }),
};