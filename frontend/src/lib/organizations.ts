import { apiFetch } from './client';

export type Organization = {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateOrganizationInput = {
  name: string;
  slug: string;
};

export async function getOrganizations() {
  return apiFetch<Organization[]>('/organizations');
}

export async function getOrganizationById(id: string) {
  return apiFetch<Organization>(`/organizations/${id}`);
}

export async function createOrganization(input: CreateOrganizationInput) {
  return apiFetch<Organization>('/organizations', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}