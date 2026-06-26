import { apiFetch } from './client';

export type DeploymentLog = {
  id: string;
  deploymentId: string;
  level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
  message: string;
  timestamp: string;
};

export type DeploymentMetric = {
  id: string;
  deploymentId: string;
  cpuUsage: number;
  memoryUsage: number;
  networkUsage: number;
  timestamp: string;
};

export type Deployment = {
  id: string;
  projectId: string;
  environmentId: string;
  clusterId?: string | null;
  namespaceId?: string | null;
  imageTag: string;
  commitSha: string;
  status: 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED' | 'ROLLBACK';
  deployedById?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type DeploymentDetail = Deployment & {
  project?: {
    id: string;
    name: string;
    organizationId?: string;
  };
  environment?: {
    id: string;
    name: string;
    type: 'DEVELOPMENT' | 'STAGING' | 'PRODUCTION';
  };
  cluster?: {
    id: string;
    name: string;
    provider: string;
    region: string;
  } | null;
  namespace?: {
    id: string;
    name: string;
  } | null;
  logs?: DeploymentLog[];
  metrics?: DeploymentMetric[];
};

export type CreateDeploymentInput = {
  projectId: string;
  environmentId: string;
  imageTag: string;
  commitSha: string;
  clusterId?: string;
  namespaceId?: string;
};

export async function getDeploymentsByProject(projectId: string) {
  return apiFetch<Deployment[]>(
    `/deployments?projectId=${encodeURIComponent(projectId)}`
  );
}

export async function getDeploymentById(id: string) {
  return apiFetch<DeploymentDetail>(`/deployments/${id}`);
}

export async function createDeployment(input: CreateDeploymentInput) {
  return apiFetch<Deployment>('/deployments', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function restartDeployment(id: string) {
  return apiFetch<DeploymentDetail>(`/deployments/${id}/restart`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

export async function rollbackDeployment(id: string, toRevision?: number) {
  return apiFetch<DeploymentDetail>(`/deployments/${id}/rollback`, {
    method: 'POST',
    body: JSON.stringify(
      typeof toRevision === 'number' ? { toRevision } : {}
    ),
  });
}