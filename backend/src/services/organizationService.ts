import { prisma } from '../lib/prisma.js';
import { ApiError } from '../middleware/errorHandler.js';
import { auditLogService } from './auditLogService.js';

export const organizationService = {
  /**
   * Create a new organization
   * Also creates the creator's OWNER membership atomically
   */
  async create(name: string, slug: string, userId: string) {
    const existingOrg = await prisma.organization.findUnique({
      where: { slug },
    });

    if (existingOrg) {
      throw new ApiError(
        409,
        'Organization with this slug already exists',
        'ORG_SLUG_EXISTS'
      );
    }

    const org = await prisma.$transaction(async (tx) => {
      const createdOrg = await tx.organization.create({
        data: {
          name,
          slug,
        },
      });

      await tx.membership.create({
        data: {
          userId,
          organizationId: createdOrg.id,
          role: 'OWNER',
        },
      });

      return createdOrg;
    });

    await auditLogService.logSafe({
      userId,
      action: 'ORGANIZATION_CREATED',
      resource: 'ORGANIZATION',
      resourceId: org.id,
      details: {
        name: org.name,
        slug: org.slug,
      },
    });

    return org;
  },

  /**
   * Get all organizations for a user
   */
  async getUserOrganizations(userId: string) {
    return prisma.organization.findMany({
      where: {
        memberships: {
          some: {
            userId,
          },
        },
      },
      include: {
        memberships: true,
      },
    });
  },

  /**
   * Get organization by ID
   */
  async getById(id: string) {
    const org = await prisma.organization.findUnique({
      where: { id },
      include: {
        memberships: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!org) {
      throw new ApiError(404, 'Organization not found', 'ORG_NOT_FOUND');
    }

    return org;
  },

  /**
   * Update organization
   */
  async update(
    id: string,
    data: { name?: string; slug?: string },
    actorUserId: string
  ) {
    try {
      const org = await prisma.organization.update({
        where: { id },
        data,
      });

      await auditLogService.logSafe({
        userId: actorUserId,
        action: 'ORGANIZATION_UPDATED',
        resource: 'ORGANIZATION',
        resourceId: org.id,
        details: data,
      });

      return org;
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new ApiError(404, 'Organization not found', 'ORG_NOT_FOUND');
      }

      if (error.code === 'P2002') {
        throw new ApiError(
          409,
          'Organization with this slug already exists',
          'ORG_SLUG_EXISTS'
        );
      }

      throw error;
    }
  },
};