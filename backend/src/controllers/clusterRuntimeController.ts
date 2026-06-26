import type { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { kubernetesService } from '../services/kubernetesService.js';

export const clusterRuntimeController = {
  getPods: asyncHandler(async (req: Request, res: Response) => {
    const clusterId = req.params.id;
    const namespace = req.query.namespace as string;
    const app = req.query.app as string | undefined;

    const raw = await kubernetesService.getPods(clusterId, namespace, app);

    const pods = (raw.items ?? []).map((item: any) => ({
      name: item.metadata?.name,
      namespace: item.metadata?.namespace,
      phase: item.status?.phase,
      podIP: item.status?.podIP ?? null,
      hostIP: item.status?.hostIP ?? null,
      nodeName: item.spec?.nodeName ?? null,
      startTime: item.status?.startTime ?? null,
      labels: item.metadata?.labels ?? {},
      containers: (item.status?.containerStatuses ?? []).map((container: any) => ({
        name: container.name,
        ready: container.ready,
        restartCount: container.restartCount,
        image: container.image,
        imageID: container.imageID,
        containerID: container.containerID,
        state: container.state,
      })),
    }));

    res.json({
      success: true,
      data: pods,
    });
  }),

  getPodLogs: asyncHandler(async (req: Request, res: Response) => {
    const clusterId = req.params.id;
    const namespace = req.query.namespace as string;
    const pod = req.query.pod as string;
    const containerName = req.query.containerName as string | undefined;

    const logs = await kubernetesService.getPodLogs(
      clusterId,
      namespace,
      pod,
      containerName
    );

    res.json({
      success: true,
      data: {
        namespace,
        pod,
        containerName: containerName ?? null,
        logs,
      },
    });
  }),
};