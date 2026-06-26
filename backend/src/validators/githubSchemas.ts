import { z } from 'zod';

const idSchema = z.string().trim().min(1, 'id is required');

export const getGitHubBranchesQuerySchema = z
  .object({
    projectId: idSchema,
  })
  .strict();