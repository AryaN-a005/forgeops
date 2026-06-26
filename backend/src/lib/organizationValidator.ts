import { z } from 'zod';

export const createOrganizationSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Organization name is required').max(255),
    slug: z
      .string()
      .min(1, 'Slug is required')
      .max(255)
      .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  }),
});

export const updateOrganizationSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(255).optional(),
    slug: z.string().min(1).max(255).regex(/^[a-z0-9-]+$/).optional(),
  }),
});

export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;
export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>;
