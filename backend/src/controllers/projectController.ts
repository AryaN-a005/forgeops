import type { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { projectService } from '../services/projectService.js';
import type { RequestWithUser } from '../types/index.js';

export const projectController = {
  create: asyncHandler(async (req: Request & RequestWithUser, res: Response) => {
    const { name, description, organizationId } = req.body;

    const project = await projectService.create(
      name,
      organizationId,
      req.user!.id,
      description
    );

    res.status(201).json({
      success: true,
      data: project,
    });
  }),

  getByOrganization: asyncHandler(
    async (req: Request & RequestWithUser, res: Response) => {
      const { organizationId } = req.query;

      if (!organizationId || typeof organizationId !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'organizationId query parameter is required',
        });
      }

      const projects = await projectService.getByOrganization(organizationId);

      res.json({
        success: true,
        data: projects,
      });
    }
  ),

  getById: asyncHandler(async (req: Request & RequestWithUser, res: Response) => {
    const project = await projectService.getById(req.params.id);

    res.json({
      success: true,
      data: project,
    });
  }),

  update: asyncHandler(async (req: Request & RequestWithUser, res: Response) => {
    const { name, description } = req.body;

    const project = await projectService.update(
      req.params.id,
      { name, description },
      req.user!.id
    );

    res.json({
      success: true,
      data: project,
    });
  }),

  delete: asyncHandler(async (req: Request & RequestWithUser, res: Response) => {
    await projectService.delete(req.params.id, req.user!.id);

    res.json({
      success: true,
      message: 'Project deleted',
    });
  }),
};