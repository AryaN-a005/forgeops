import { z } from 'zod';

export const rollbackDeploymentBodySchema = z
  .object({
    toRevision: z.number().int().positive().optional(),
  })
  .strict();