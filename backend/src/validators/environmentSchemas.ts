import { EnvironmentType } from '../generated/prisma/client';
import { z } from 'zod';

const idSchema = z.string().trim().min(1, 'id is required');

export const createEnvironmentBodySchema = z
  .object({
    projectId: idSchema,
    name: z.string().trim().min(2).max(100),
    type: z.nativeEnum(EnvironmentType),
  })
  .strict();

export const getEnvironmentsQuerySchema = z
  .object({
    projectId: idSchema,
  })
  .strict();

export const environmentIdParamSchema = z
  .object({
    id: idSchema,
  })
  .strict();

export const updateEnvironmentBodySchema = z
  .object({
    name: z.string().trim().min(2).max(100).optional(),
    type: z.nativeEnum(EnvironmentType).optional(),
  })
  .strict()
  .refine(
    (data) => data.name !== undefined || data.type !== undefined,
    'At least one field must be provided'
  );