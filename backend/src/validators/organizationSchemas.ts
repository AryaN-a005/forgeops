import { z } from 'zod';

const idSchema = z.string().trim().min(1, 'id is required');

export const createOrganizationBodySchema = z
  .object({
    name: z.string().trim().min(2).max(100),
    slug: z
      .string()
      .trim()
      .min(2)
      .max(50)
      .regex(
        /^[a-z0-9-]+$/,
        'slug must contain only lowercase letters, numbers, and hyphens'
      ),
  })
  .strict();

export const organizationIdParamSchema = z
  .object({
    id: idSchema,
  })
  .strict();