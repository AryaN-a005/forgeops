import { z } from 'zod';

const idSchema = z.string().trim().min(1, 'id is required');

export const exposeServiceBodySchema = z
  .object({
    projectId: idSchema,
    deploymentId: idSchema,
    serviceName: z.string().trim().min(2).max(63),
    port: z.number().int().positive().max(65535),
    targetPort: z.number().int().positive().max(65535),
    type: z.enum(['ClusterIP', 'NodePort', 'LoadBalancer']).default('ClusterIP'),
  })
  .strict();

export const getServicesQuerySchema = z
  .object({
    projectId: idSchema,
    namespaceId: idSchema,
  })
  .strict();

export const exposeIngressBodySchema = z
  .object({
    projectId: idSchema,
    namespaceId: idSchema,
    ingressName: z.string().trim().min(2).max(63),
    serviceName: z.string().trim().min(2).max(63),
    host: z.string().trim().min(1),
    path: z.string().trim().min(1).default('/'),
    servicePort: z.number().int().positive().max(65535).default(80),
    pathType: z.enum(['Prefix', 'Exact', 'ImplementationSpecific']).default('Prefix'),
    ingressClassName: z.string().trim().min(1).optional(),
  })
  .strict();

export const getIngressesQuerySchema = z
  .object({
    projectId: idSchema,
    namespaceId: idSchema,
  })
  .strict();