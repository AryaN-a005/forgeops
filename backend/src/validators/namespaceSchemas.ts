import { z } from 'zod';

const idSchema = z.string().trim().min(1, 'id is required');

export const createNamespaceBodySchema = z
  .object({
    clusterId: idSchema,
    projectId: idSchema,
    name: z.string().trim().min(2).max(63),
  })
  .strict();

export const getNamespacesQuerySchema = z
  .object({
    projectId: idSchema,
  })
  .strict();