import type { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { exposureService } from '../services/exposureService.js';
import type { RequestWithUser } from '../types/index.js';

export const exposureController = {
  exposeService: asyncHandler(async (req: Request & RequestWithUser, res: Response) => {
    const clusterId = req.params.id;
    const { projectId, deploymentId, serviceName, port, targetPort, type } = req.body;

    const service = await exposureService.exposeService({
      clusterId,
      projectId,
      deploymentId,
      serviceName,
      port,
      targetPort,
      type,
      actorUserId: req.user!.id,
    });

    res.status(201).json({
      success: true,
      data: service,
    });
  }),

  getServices: asyncHandler(async (req: Request, res: Response) => {
    const clusterId = req.params.id;
    const projectId = req.query.projectId as string;
    const namespaceId = req.query.namespaceId as string;

    const services = await exposureService.getServices({
      clusterId,
      projectId,
      namespaceId,
    });

    res.json({
      success: true,
      data: services,
    });
  }),

  exposeIngress: asyncHandler(async (req: Request & RequestWithUser, res: Response) => {
    const clusterId = req.params.id;
    const {
      projectId,
      namespaceId,
      ingressName,
      serviceName,
      host,
      path,
      servicePort,
      pathType,
      ingressClassName,
    } = req.body;

    const ingress = await exposureService.exposeIngress({
      clusterId,
      projectId,
      namespaceId,
      ingressName,
      serviceName,
      host,
      path,
      servicePort,
      pathType,
      ingressClassName,
      actorUserId: req.user!.id,
    });

    res.status(201).json({
      success: true,
      data: ingress,
    });
  }),

  getIngresses: asyncHandler(async (req: Request, res: Response) => {
    const clusterId = req.params.id;
    const projectId = req.query.projectId as string;
    const namespaceId = req.query.namespaceId as string;

    const ingresses = await exposureService.getIngresses({
      clusterId,
      projectId,
      namespaceId,
    });

    res.json({
      success: true,
      data: ingresses,
    });
  }),
};