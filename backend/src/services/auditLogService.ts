import { prisma } from '../lib/prisma.js';

type AuditLogInput = {
  userId: string;
  action: string;
  resource: string;
  resourceId: string;
  details?: Record<string, unknown> | null;
};

export const auditLogService = {
  async log({
    userId,
    action,
    resource,
    resourceId,
    details,
  }: AuditLogInput) {
    return prisma.auditLog.create({
      data: {
        userId,
        action,
        resource,
        resourceId,
        details: details ? JSON.stringify(details) : null,
      },
    });
  },

  async logSafe(input: AuditLogInput) {
    try {
      return await this.log(input);
    } catch (error) {
      console.error('Failed to create audit log:', error);
      return null;
    }
  },
};