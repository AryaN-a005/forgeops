import type { Request, Response, NextFunction } from 'express';
import { clerkMiddleware, getAuth } from '@clerk/express';
import { ApiError } from './errorHandler.js';
import { userService } from '../services/userService.js';
import { prisma } from '../lib/prisma.js';
import type { RequestWithUser } from '../types/index.js';
import type { Role } from '../generated/prisma/client';

export const clerkAuth = clerkMiddleware();

const getStringClaim = (value: unknown): string | undefined => {
  return typeof value === 'string' && value.trim().length > 0 ? value : undefined;
};

const attachUserToRequest = (
  req: Request & RequestWithUser,
  dbUser: {
    id: string;
    clerkId: string;
    email: string;
    name: string | null;
    imageUrl: string | null;
  }
) => {
  req.user = {
    id: dbUser.id,
    clerkId: dbUser.clerkId,
    email: dbUser.email,
    name: dbUser.name,
    imageUrl: dbUser.imageUrl,
  };
};

const attachDevUser = async (req: Request & RequestWithUser) => {
  const dbUser = await userService.syncClerkUser({
    clerkId: process.env.DEV_BYPASS_CLERK_ID || 'dev_clerk_user_1',
    email: process.env.DEV_BYPASS_EMAIL || 'dev@forgeops.local',
    firstName: process.env.DEV_BYPASS_FIRST_NAME || 'Dev',
    lastName: process.env.DEV_BYPASS_LAST_NAME || 'User',
    imageUrl: process.env.DEV_BYPASS_IMAGE_URL || undefined,
  });

  attachUserToRequest(req, dbUser);
};

export const requireAuth = async (
  req: Request & RequestWithUser,
  _res: Response,
  next: NextFunction
) => {
  try {
    const auth = getAuth(req);
    const clerkId = auth.userId;

    const isDevBypassEnabled =
      process.env.NODE_ENV !== 'production' &&
      process.env.DEV_BYPASS_AUTH === 'true';

    if (!clerkId && isDevBypassEnabled) {
      await attachDevUser(req);
      return next();
    }

    if (!clerkId) {
      throw new ApiError(401, 'Unauthorized', 'AUTH_REQUIRED');
    }

    const claims = (auth.sessionClaims ?? {}) as Record<string, unknown>;

    const email =
      getStringClaim(claims.email) ??
      getStringClaim(claims.primaryEmail) ??
      getStringClaim(claims['email_address']);

    const firstName =
      getStringClaim(claims.first_name) ??
      getStringClaim(claims.given_name);

    const lastName =
      getStringClaim(claims.last_name) ??
      getStringClaim(claims.family_name);

    const imageUrl =
      getStringClaim(claims.image_url) ??
      getStringClaim(claims.picture);

    const dbUser = await userService.syncClerkUser({
      clerkId,
      email,
      firstName,
      lastName,
      imageUrl,
    });

    attachUserToRequest(req, dbUser);
    return next();
  } catch (error) {
    return next(error);
  }
};

export const optionalAuth = async (
  req: Request & RequestWithUser,
  _res: Response,
  next: NextFunction
) => {
  try {
    const auth = getAuth(req);
    const clerkId = auth.userId;

    const isDevBypassEnabled =
      process.env.NODE_ENV !== 'production' &&
      process.env.DEV_BYPASS_AUTH === 'true';

    if (!clerkId && isDevBypassEnabled) {
      await attachDevUser(req);
      return next();
    }

    if (!clerkId) {
      return next();
    }

    const claims = (auth.sessionClaims ?? {}) as Record<string, unknown>;

    const email =
      getStringClaim(claims.email) ??
      getStringClaim(claims.primaryEmail) ??
      getStringClaim(claims['email_address']);

    const firstName =
      getStringClaim(claims.first_name) ??
      getStringClaim(claims.given_name);

    const lastName =
      getStringClaim(claims.last_name) ??
      getStringClaim(claims.family_name);

    const imageUrl =
      getStringClaim(claims.image_url) ??
      getStringClaim(claims.picture);

    const dbUser = await userService.syncClerkUser({
      clerkId,
      email,
      firstName,
      lastName,
      imageUrl,
    });

    attachUserToRequest(req, dbUser);
    return next();
  } catch (error) {
    return next(error);
  }
};

const resolveOrganizationId = async (req: Request): Promise<string> => {
  const bodyOrganizationId =
    typeof req.body?.organizationId === 'string' ? req.body.organizationId : undefined;

  const queryOrganizationId =
    typeof req.query.organizationId === 'string' ? req.query.organizationId : undefined;

  const paramOrganizationId =
    typeof req.params.organizationId === 'string' ? req.params.organizationId : undefined;

  if (bodyOrganizationId) return bodyOrganizationId;
  if (queryOrganizationId) return queryOrganizationId;
  if (paramOrganizationId) return paramOrganizationId;

  if (req.path.startsWith('/organizations/') && req.params.id) {
    return req.params.id;
  }

  const projectId =
    (typeof req.body?.projectId === 'string' ? req.body.projectId : undefined) ??
    (typeof req.query.projectId === 'string' ? req.query.projectId : undefined) ??
    (typeof req.params.projectId === 'string' ? req.params.projectId : undefined) ??
    (req.path.startsWith('/projects/') ? req.params.id : undefined);

  if (projectId) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { organizationId: true },
    });

    if (!project) {
      throw new ApiError(404, 'Project not found', 'PROJECT_NOT_FOUND');
    }

    return project.organizationId;
  }

  const environmentId =
    (typeof req.body?.environmentId === 'string' ? req.body.environmentId : undefined) ??
    (typeof req.query.environmentId === 'string' ? req.query.environmentId : undefined) ??
    (typeof req.params.environmentId === 'string' ? req.params.environmentId : undefined) ??
    (req.path.startsWith('/environments/') ? req.params.id : undefined);

  if (environmentId) {
    const environment = await prisma.environment.findUnique({
      where: { id: environmentId },
      select: {
        project: {
          select: { organizationId: true },
        },
      },
    });

    if (!environment) {
      throw new ApiError(404, 'Environment not found', 'ENV_NOT_FOUND');
    }

    return environment.project.organizationId;
  }

  const deploymentId =
    (typeof req.body?.deploymentId === 'string' ? req.body.deploymentId : undefined) ??
    (typeof req.query.deploymentId === 'string' ? req.query.deploymentId : undefined) ??
    (typeof req.params.deploymentId === 'string' ? req.params.deploymentId : undefined) ??
    (req.path.startsWith('/deployments/') ? req.params.id : undefined);

  if (deploymentId) {
    const deployment = await prisma.deployment.findUnique({
      where: { id: deploymentId },
      select: {
        project: {
          select: { organizationId: true },
        },
      },
    });

    if (!deployment) {
      throw new ApiError(404, 'Deployment not found', 'DEPLOYMENT_NOT_FOUND');
    }

    return deployment.project.organizationId;
  }

  throw new ApiError(
    400,
    'Unable to resolve organization scope for role check',
    'RBAC_SCOPE_REQUIRED'
  );
};

export const requireRole = (roles: Role[]) => {
  return async (
    req: Request & RequestWithUser,
    _res: Response,
    next: NextFunction
  ) => {
    try {
      if (!req.user?.id) {
        throw new ApiError(401, 'Unauthorized', 'AUTH_REQUIRED');
      }

      const organizationId = await resolveOrganizationId(req);

      const membership = await prisma.membership.findUnique({
        where: {
          userId_organizationId: {
            userId: req.user.id,
            organizationId,
          },
        },
      });

      if (!membership) {
        throw new ApiError(
          403,
          'You are not a member of this organization',
          'MEMBERSHIP_REQUIRED'
        );
      }

      if (!roles.includes(membership.role)) {
        throw new ApiError(403, 'Insufficient permissions', 'INSUFFICIENT_ROLE');
      }

      req.membership = {
        organizationId: membership.organizationId,
        role: membership.role,
      };

      return next();
    } catch (error) {
      return next(error);
    }
  };
};