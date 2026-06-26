import { prisma } from '../lib/prisma.js';
import { ApiError } from '../middleware/errorHandler.js';

type SyncClerkUserInput = {
  clerkId: string;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  imageUrl?: string | null;
};

const buildName = (firstName?: string | null, lastName?: string | null) => {
  const fullName = [firstName, lastName].filter(Boolean).join(' ').trim();
  return fullName.length ? fullName : null;
};

export const userService = {
  async syncClerkUser({
    clerkId,
    email,
    firstName,
    lastName,
    imageUrl,
  }: SyncClerkUserInput) {
    if (!email) {
      throw new ApiError(400, 'Email is required from Clerk session', 'EMAIL_REQUIRED');
    }

    const name = buildName(firstName, lastName);

    return prisma.user.upsert({
      where: { clerkId },
      update: {
        email,
        name,
        imageUrl: imageUrl ?? null,
      },
      create: {
        clerkId,
        email,
        name,
        imageUrl: imageUrl ?? null,
      },
    });
  },

  async getUserByClerkId(clerkId: string) {
    return prisma.user.findUnique({
      where: { clerkId },
    });
  },

  async getUserById(id: string) {
    return prisma.user.findUnique({
      where: { id },
    });
  },
};