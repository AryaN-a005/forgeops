import { z } from 'zod';

const idSchema = z.string().trim().min(1, 'id is required');

export const createProjectBodySchema = z
  .object({
    name: z.string().trim().min(2).max(100),
    description: z.string().trim().max(500).optional(),
    organizationId: idSchema,
  })
  .strict();

export const getProjectsQuerySchema = z
  .object({
    organizationId: idSchema,
  })
  .strict();

export const projectIdParamSchema = z
  .object({
    id: idSchema,
  })
  .strict();