import { z } from 'zod';
import { ClusterProvider } from '../generated/prisma/client';

const idSchema = z.string().trim().min(1, 'id is required');

export const createClusterBodySchema = z
  .object({
    name: z.string().trim().min(2).max(100),
    provider: z.nativeEnum(ClusterProvider),
    region: z.string().trim().min(2).max(100),
    kubeConfig: z.string().min(1, 'kubeConfig is required'),
  })
  .strict();

export const clusterIdParamSchema = z
  .object({
    id: idSchema,
  })
  .strict();