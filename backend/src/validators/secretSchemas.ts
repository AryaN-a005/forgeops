import { z } from 'zod';

const idSchema = z.string().trim().min(1, 'id is required');

export const createSecretBodySchema = z
  .object({
    projectId: idSchema,
    environmentId: idSchema,
    key: z
      .string()
      .trim()
      .min(1)
      .max(100)
      .regex(
        /^[A-Za-z_][A-Za-z0-9_]*$/,
        'key must start with a letter or underscore and contain only letters, numbers, and underscores'
      ),
    value: z.string().min(1).max(10000),
  })
  .strict();

export const getSecretsQuerySchema = z
  .object({
    projectId: idSchema,
    environmentId: idSchema,
  })
  .strict();