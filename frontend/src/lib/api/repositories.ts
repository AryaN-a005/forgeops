import { apiFetch } from './client';

export type Repository = {
  id: string;
  projectId: string;
  provider: 'GITHUB' | 'GITLAB' | 'BITBUCKET';
  repoUrl: string;
  repoName: string;
  defaultBranch: string;
  createdAt?: string;
  updatedAt?: string;
};

export type CreateRepositoryInput = {
  projectId: string;
  provider: 'GITHUB' | 'GITLAB' | 'BITBUCKET';
  repoUrl: string;
  repoName: string;
  defaultBranch?: string;
};

export async function getRepositoryByProject(projectId: string) {
  return apiFetch<Repository>(
    `/repositories?projectId=${encodeURIComponent(projectId)}`
  );
}

export async function createRepository(input: CreateRepositoryInput) {
  return apiFetch<Repository>('/repositories', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}