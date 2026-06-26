import { apiFetch } from './client';

export type Environment = {
  id: string;
  projectId: string;
  name: string;
  type: 'DEVELOPMENT' | 'STAGING' | 'PRODUCTION';
  createdAt: string;
  updatedAt: string;
};

export type CreateEnvironmentInput = {
  projectId: string;
  name: string;
  type: 'DEVELOPMENT' | 'STAGING' | 'PRODUCTION';
};

export async function getEnvironmentsByProject(projectId: string) {
  return apiFetch<Environment[]>(
    `/environments?projectId=${encodeURIComponent(projectId)}`
  );
}

export async function createEnvironment(input: CreateEnvironmentInput) {
  return apiFetch<Environment>('/environments', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}