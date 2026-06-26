import type { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { organizationService } from '../services/organizationService.js';
import type { RequestWithUser } from '../types/index.js';

export const organizationController = {
  create: asyncHandler(async (req: Request & RequestWithUser, res: Response) => {
    const { name, slug } = req.body;

    const org = await organizationService.create(name, slug, req.user!.id);

    res.status(201).json({
      success: true,
      data: org,
    });
  }),

  getAll: asyncHandler(async (req: Request & RequestWithUser, res: Response) => {
    const orgs = await organizationService.getUserOrganizations(req.user!.id);

    res.json({
      success: true,
      data: orgs,
    });
  }),

  getById: asyncHandler(async (req: Request & RequestWithUser, res: Response) => {
    const org = await organizationService.getById(req.params.id);

    res.json({
      success: true,
      data: org,
    });
  }),

  update: asyncHandler(async (req: Request & RequestWithUser, res: Response) => {
    const { name, slug } = req.body;

    const org = await organizationService.update(
      req.params.id,
      { name, slug },
      req.user!.id
    );

    res.json({
      success: true,
      data: org,
    });
  }),
};