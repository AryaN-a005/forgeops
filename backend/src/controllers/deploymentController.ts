import type { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { deploymentService } from '../services/deploymentService.js';
import type { RequestWithUser } from '../types/index.js';

export const deploymentController = {
  create: asyncHandler(async (req: Request & RequestWithUser, res: Response) => {
    const {
      projectId,
      environmentId,
      imageTag,
      commitSha,
      clusterId,
      namespaceId,
    } = req.body;

    const deployment = await deploymentService.create({
      projectId,
      environmentId,
      imageTag,
      commitSha,
      clusterId,
      namespaceId,
      deployedById: req.user!.id,
    });

    res.status(201).json({
      success: true,
      data: deployment,
    });
  }),

  restart: asyncHandler(async (req: Request & RequestWithUser, res: Response) => {
    const deployment = await deploymentService.restart(req.params.id, req.user!.id);

    res.json({
      success: true,
      data: deployment,
      message: 'Deployment restarted successfully',
    });
  }),

  rollback: asyncHandler(async (req: Request & RequestWithUser, res: Response) => {
    const toRevision =
      typeof req.body?.toRevision === 'number' ? req.body.toRevision : undefined;

    const deployment = await deploymentService.rollback(
      req.params.id,
      req.user!.id,
      toRevision
    );

    res.json({
      success: true,
      data: deployment,
      message: 'Deployment rolled back successfully',
    });
  }),

  getByProject: asyncHandler(async (req: Request & RequestWithUser, res: Response) => {
    const { projectId } = req.query;

    if (!projectId || typeof projectId !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'projectId query parameter is required',
      });
    }

    const deployments = await deploymentService.getByProject(projectId);

    res.json({
      success: true,
      data: deployments,
    });
  }),

  getById: asyncHandler(async (req: Request & RequestWithUser, res: Response) => {
    const deployment = await deploymentService.getById(req.params.id);

    res.json({
      success: true,
      data: deployment,
    });
  }),
};