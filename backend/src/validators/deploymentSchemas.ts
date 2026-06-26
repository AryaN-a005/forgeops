import { z } from 'zod';

const idSchema = z.string().trim().min(1, 'id is required');

export const createDeploymentBodySchema = z
  .object({
    projectId: idSchema,
    environmentId: idSchema,
    imageTag: z.string().trim().min(1).max(120),
    commitSha: z
      .string()
      .trim()
      .regex(/^[a-fA-F0-9]{7,64}$/, 'commitSha must be a valid git sha'),
    clusterId: idSchema.optional(),
    namespaceId: idSchema.optional(),
  })
  .strict()
  .refine(
    (data) =>
      (data.clusterId && data.namespaceId) ||
      (!data.clusterId && !data.namespaceId),
    'clusterId and namespaceId must be provided together'
  );

export const getDeploymentsQuerySchema = z
  .object({
    projectId: idSchema,
  })
  .strict();

export const deploymentIdParamSchema = z
  .object({
    id: idSchema,
  })
  .strict();