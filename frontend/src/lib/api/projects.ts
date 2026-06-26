import { apiFetch } from './client';

export type Project = {
  id: string;
  name: string;
  description?: string | null;
  organizationId: string;
  createdById?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateProjectInput = {
  name: string;
  description?: string;
  organizationId: string;
};

export async function getProjectsByOrganization(organizationId: string) {
  return apiFetch<Project[]>(
    `/projects?organizationId=${encodeURIComponent(organizationId)}`
  );
}

export async function getProjectById(id: string) {
  return apiFetch<Project>(`/projects/${id}`);
}

export async function createProject(input: CreateProjectInput) {
  return apiFetch<Project>('/projects', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}