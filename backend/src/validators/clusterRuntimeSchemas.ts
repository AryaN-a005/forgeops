import { z } from 'zod';

const idSchema = z.string().trim().min(1, 'id is required');

export const getClusterPodsQuerySchema = z
  .object({
    projectId: idSchema,
    namespace: z.string().trim().min(1, 'namespace is required'),
    app: z.string().trim().min(1).optional(),
  })
  .strict();

export const getClusterLogsQuerySchema = z
  .object({
    projectId: idSchema,
    namespace: z.string().trim().min(1, 'namespace is required'),
    pod: z.string().trim().min(1, 'pod is required'),
    containerName: z.string().trim().min(1).optional(),
  })
  .strict();