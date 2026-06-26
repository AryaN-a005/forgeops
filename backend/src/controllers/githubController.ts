import type { Request, Response } from 'express';
import { asyncHandler, ApiError } from '../middleware/errorHandler.js';
import { githubService } from '../services/githubService.js';
import type { RequestWithUser } from '../types/index.js';

const getHeaderValue = (value: string | string[] | undefined) => {
  if (Array.isArray(value)) return value[0];
  return value;
};

export const githubController = {
  getBranches: asyncHandler(async (req: Request & RequestWithUser, res: Response) => {
    const { projectId } = req.query;

    if (!projectId || typeof projectId !== 'string') {
      throw new ApiError(400, 'projectId query parameter is required', 'VALIDATION_ERROR');
    }

    const branches = await githubService.getBranchesByProject(projectId);

    res.json({
      success: true,
      data: branches,
    });
  }),

  handleWebhook: asyncHandler(async (req: Request, res: Response) => {
    const event = getHeaderValue(req.headers['x-github-event']);
    const signature = getHeaderValue(req.headers['x-hub-signature-256']);
    const rawBody = (req as Request & { rawBody?: string }).rawBody;

    if (!event) {
      throw new ApiError(400, 'Missing GitHub event header', 'GITHUB_EVENT_HEADER_MISSING');
    }

    if (!signature) {
      throw new ApiError(
        400,
        'Missing GitHub signature header',
        'GITHUB_SIGNATURE_HEADER_MISSING'
      );
    }

    if (!rawBody) {
      throw new ApiError(400, 'Missing raw request body', 'RAW_BODY_MISSING');
    }

    githubService.verifyWebhookSignature(rawBody, signature);

    if (event === 'ping') {
      return res.status(200).json({
        success: true,
        message: 'GitHub webhook received',
      });
    }

    if (event === 'push') {
      const result = await githubService.handlePushWebhook(req.body);

      return res.status(202).json({
        success: true,
        data: result,
      });
    }

    return res.status(202).json({
      success: true,
      message: `GitHub event '${event}' received`,
    });
  }),
};