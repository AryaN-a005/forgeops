import { Router } from 'express';
import type { Request, Response } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import {
  validateBody,
  validateParams,
  validateQuery,
} from '../middleware/validate.js';

import { organizationController } from '../controllers/organizationController.js';
import { projectController } from '../controllers/projectController.js';
import { environmentController } from '../controllers/environmentController.js';
import { repositoryController } from '../controllers/repositoryController.js';
import { deploymentController } from '../controllers/deploymentController.js';
import { secretController } from '../controllers/secretController.js';
import { githubController } from '../controllers/githubController.js';

import {
  createOrganizationBodySchema,
  organizationIdParamSchema,
} from '../validators/organizationSchemas.js';

import {
  createProjectBodySchema,
  getProjectsQuerySchema,
  projectIdParamSchema,
} from '../validators/projectSchemas.js';

import {
  createRepositoryBodySchema,
  getRepositoriesQuerySchema,
  repositoryIdParamSchema,
} from '../validators/repositorySchemas.js';

import {
  createEnvironmentBodySchema,
  getEnvironmentsQuerySchema,
  environmentIdParamSchema,
  updateEnvironmentBodySchema,
} from '../validators/environmentSchemas.js';

import {
  createDeploymentBodySchema,
  getDeploymentsQuerySchema,
  deploymentIdParamSchema,
} from '../validators/deploymentSchemas.js';

import {
  createSecretBodySchema,
  getSecretsQuerySchema,
} from '../validators/secretSchemas.js';

import { getGitHubBranchesQuerySchema } from '../validators/githubSchemas.js';
import { clusterController } from '../controllers/clusterController.js';
import { namespaceController } from '../controllers/namespaceController.js';

import {
  createClusterBodySchema,
  clusterIdParamSchema,
} from '../validators/clusterSchemas.js';

import {
  createNamespaceBodySchema,
  getNamespacesQuerySchema,
} from '../validators/namespaceSchemas.js';

import { clusterRuntimeController } from '../controllers/clusterRuntimeController.js';

import {
  getClusterPodsQuerySchema,
  getClusterLogsQuerySchema,
} from '../validators/clusterRuntimeSchemas.js';
import { rollbackDeploymentBodySchema } from '../validators/deploymentActionSchemas.js';
import { exposureController } from '../controllers/exposureController.js';

import {
  exposeServiceBodySchema,
  getServicesQuerySchema,
  exposeIngressBodySchema,
  getIngressesQuerySchema,
} from '../validators/exposureSchemas.js';

import type { RequestWithUser } from '../types/index.js';

const router = Router();

/** 
 * Public GitHub webhook route
 * Must remain before requireAuth()
 */
router.post('/github/webhooks', githubController.handleWebhook);

// Protected routes
router.use(requireAuth);

// Current authenticated/synced user
router.get(
  '/me',
  asyncHandler(async (req: Request & RequestWithUser, res: Response) => {
    res.json({
      success: true,
      data: req.user,
    });
  })
);
// Clusters
router.post(
  '/clusters',
  validateBody(createClusterBodySchema),
  clusterController.create
);

router.get('/clusters', clusterController.getAll);

router.get(
  '/clusters/:id',
  validateParams(clusterIdParamSchema),
  clusterController.getById
);
router.post(
  '/clusters/:id/services/expose',
  validateParams(clusterIdParamSchema),
  validateBody(exposeServiceBodySchema),
  requireRole(['OWNER', 'ADMIN', 'DEVELOPER']),
  exposureController.exposeService
);

router.get(
  '/clusters/:id/services',
  validateParams(clusterIdParamSchema),
  validateQuery(getServicesQuerySchema),
  requireRole(['OWNER', 'ADMIN', 'DEVELOPER', 'VIEWER']),
  exposureController.getServices
);

router.post(
  '/clusters/:id/ingresses/expose',
  validateParams(clusterIdParamSchema),
  validateBody(exposeIngressBodySchema),
  requireRole(['OWNER', 'ADMIN', 'DEVELOPER']),
  exposureController.exposeIngress
);

router.get(
  '/clusters/:id/ingresses',
  validateParams(clusterIdParamSchema),
  validateQuery(getIngressesQuerySchema),
  requireRole(['OWNER', 'ADMIN', 'DEVELOPER', 'VIEWER']),
  exposureController.getIngresses
);
// Namespaces
router.post(
  '/namespaces',
  validateBody(createNamespaceBodySchema),
  requireRole(['OWNER', 'ADMIN', 'DEVELOPER']),
  namespaceController.create
);

router.get(
  '/namespaces',
  validateQuery(getNamespacesQuerySchema),
  requireRole(['OWNER', 'ADMIN', 'DEVELOPER', 'VIEWER']),
  namespaceController.getByProject
);
router.get(
  '/clusters/:id/pods',
  validateParams(clusterIdParamSchema),
  validateQuery(getClusterPodsQuerySchema),
  requireRole(['OWNER', 'ADMIN', 'DEVELOPER', 'VIEWER']),
  clusterRuntimeController.getPods
);

router.get(
  '/clusters/:id/logs',
  validateParams(clusterIdParamSchema),
  validateQuery(getClusterLogsQuerySchema),
  requireRole(['OWNER', 'ADMIN', 'DEVELOPER', 'VIEWER']),
  clusterRuntimeController.getPodLogs
);
// Organizations
router.post(
  '/organizations',
  validateBody(createOrganizationBodySchema),
  organizationController.create
);

router.get('/organizations', organizationController.getAll);

router.get(
  '/organizations/:id',
  validateParams(organizationIdParamSchema),
  organizationController.getById
);

// Projects
router.post(
  '/projects',
  validateBody(createProjectBodySchema),
  requireRole(['OWNER', 'ADMIN']),
  projectController.create
);

router.get(
  '/projects',
  validateQuery(getProjectsQuerySchema),
  projectController.getByOrganization
);

router.get(
  '/projects/:id',
  validateParams(projectIdParamSchema),
  projectController.getById
);

// GitHub
router.get(
  '/github/branches',
  validateQuery(getGitHubBranchesQuerySchema),
  requireRole(['OWNER', 'ADMIN', 'DEVELOPER', 'VIEWER']),
  githubController.getBranches
);

// Repositories
router.post(
  '/repositories',
  validateBody(createRepositoryBodySchema),
  requireRole(['OWNER', 'ADMIN']),
  repositoryController.create
);

router.get(
  '/repositories',
  validateQuery(getRepositoriesQuerySchema),
  repositoryController.getByProject
);

router.get(
  '/repositories/:id',
  validateParams(repositoryIdParamSchema),
  repositoryController.getById
);

// Environments
router.post(
  '/environments',
  validateBody(createEnvironmentBodySchema),
  requireRole(['OWNER', 'ADMIN', 'DEVELOPER']),
  environmentController.create
);

router.get(
  '/environments',
  validateQuery(getEnvironmentsQuerySchema),
  requireRole(['OWNER', 'ADMIN', 'DEVELOPER', 'VIEWER']),
  environmentController.getByProject
);

router.get(
  '/environments/:id',
  validateParams(environmentIdParamSchema),
  requireRole(['OWNER', 'ADMIN', 'DEVELOPER', 'VIEWER']),
  environmentController.getById
);

router.patch(
  '/environments/:id',
  validateParams(environmentIdParamSchema),
  validateBody(updateEnvironmentBodySchema),
  requireRole(['OWNER', 'ADMIN', 'DEVELOPER']),
  environmentController.update
);

router.delete(
  '/environments/:id',
  validateParams(environmentIdParamSchema),
  requireRole(['OWNER', 'ADMIN']),
  environmentController.delete
);

// Deployments
router.post(
  '/deployments',
  validateBody(createDeploymentBodySchema),
  requireRole(['OWNER', 'ADMIN', 'DEVELOPER']),
  deploymentController.create
);

router.get(
  '/deployments',
  validateQuery(getDeploymentsQuerySchema),
  requireRole(['OWNER', 'ADMIN', 'DEVELOPER', 'VIEWER']),
  deploymentController.getByProject
);

router.get(
  '/deployments/:id',
  validateParams(deploymentIdParamSchema),
  requireRole(['OWNER', 'ADMIN', 'DEVELOPER', 'VIEWER']),
  deploymentController.getById
);
router.post(
  '/deployments/:id/restart',
  validateParams(deploymentIdParamSchema),
  requireRole(['OWNER', 'ADMIN', 'DEVELOPER']),
  deploymentController.restart
);

router.post(
  '/deployments/:id/rollback',
  validateParams(deploymentIdParamSchema),
  validateBody(rollbackDeploymentBodySchema),
  requireRole(['OWNER', 'ADMIN', 'DEVELOPER']),
  deploymentController.rollback
);

// Secrets
router.post(
  '/secrets',
  validateBody(createSecretBodySchema),
  requireRole(['OWNER', 'ADMIN', 'DEVELOPER']),
  secretController.create
);

router.get(
  '/secrets',
  validateQuery(getSecretsQuerySchema),
  requireRole(['OWNER', 'ADMIN', 'DEVELOPER']),
  secretController.getByEnvironment
);

export default router;