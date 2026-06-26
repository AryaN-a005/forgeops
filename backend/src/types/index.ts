import type { Role } from '../generated/prisma/client';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  message?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  order?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AuthUser {
  id: string;
  clerkId: string;
  email: string;
  name?: string | null;
  imageUrl?: string | null;
}

export interface RequestWithUser {
  user?: AuthUser;
  membership?: {
    organizationId: string;
    role: Role;
  };
}