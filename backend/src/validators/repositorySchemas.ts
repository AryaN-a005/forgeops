import { GitProvider } from '../generated/prisma/client';
import { z } from 'zod';

const idSchema = z.string().trim().min(1, 'id is required');

export const createRepositoryBodySchema = z
  .object({
    projectId: idSchema,
    provider: z.nativeEnum(GitProvider),
    repoUrl: z.string().trim().url('repoUrl must be a valid URL'),
    repoName: z.string().trim().min(1).max(200),
    defaultBranch: z.string().trim().min(1).max(100).optional(),
  })
  .strict();

export const getRepositoriesQuerySchema = z
  .object({
    projectId: idSchema,
  })
  .strict();

export const repositoryIdParamSchema = z
  .object({
    id: idSchema,
  })
  .strict();