import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getProjectById } from '../../../lib/api/projects';
import { getRepositoryByProject } from '../../../lib/api/repositories';
import { getEnvironmentsByProject } from '../../../lib/api/environments';
import { getDeploymentsByProject } from '../../../lib/api/deployments';
import { ConnectRepositoryForm } from '../../../components/repositories/connect-repository-form';
import { CreateEnvironmentForm } from '../../../components/environments/create-environment-form';
import { TriggerDeploymentForm } from '../../deployments/trigger-deployment-form';

type Props = {
  params: Promise<{
    projectId: string;
  }>;
};

export default async function ProjectDetailPage({ params }: Props) {
  const { projectId } = await params;

  let project: any = null;
  let repository: any = null;
  let environments: any[] = [];
  let deployments: any[] = [];
  let errorMessage: string | null = null;

  try {
    project = await getProjectById(projectId);

    try {
      repository = await getRepositoryByProject(projectId);
    } catch {
      repository = null;
    }

    try {
      environments = await getEnvironmentsByProject(projectId);
    } catch {
      environments = [];
    }

    try {
      deployments = await getDeploymentsByProject(projectId);
    } catch {
      deployments = [];
    }
  } catch (error) {
    console.error('Project detail load failed:', error);
    errorMessage =
      error instanceof Error ? error.message : 'Failed to load project';
  }

  if (errorMessage) {
    return (
      <div className="space-y-6">
        <div>
          <div className="mb-2 text-sm font-medium uppercase tracking-wide text-neutral-500">
            Project
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-white">
            Failed to load project
          </h1>
        </div>

        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-4 text-sm text-red-300">
          {errorMessage}
        </div>
      </div>
    );
  }

  if (!project) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="mb-2 text-sm font-medium uppercase tracking-wide text-neutral-500">
            Project
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-white">
            {project.name}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-neutral-400">
            {project.description || 'No description provided.'}
          </p>
        </div>

        <Link
          href="/organizations"
          className="inline-flex items-center rounded-xl border border-white/10 bg-neutral-900 px-4 py-2 text-sm text-neutral-300 transition hover:border-neutral-500 hover:text-white"
        >
          Back to organizations
        </Link>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
        <div className="rounded-2xl border border-white/10 bg-neutral-900 p-6">
          <h2 className="text-lg font-semibold text-white">Repository</h2>
          <p className="mt-1 text-sm text-neutral-400">
            Source code connection for this project.
          </p>

          <div className="mt-6">
            {repository ? (
              <div className="rounded-xl border border-white/10 bg-neutral-950 p-5">
                <div className="text-sm text-neutral-500">Provider</div>
                <div className="mt-1 text-white">{repository.provider}</div>

                <div className="mt-4 text-sm text-neutral-500">Repository</div>
                <div className="mt-1 break-all text-white">{repository.repoUrl}</div>

                <div className="mt-4 text-sm text-neutral-500">Default branch</div>
                <div className="mt-1 text-white">{repository.defaultBranch}</div>
              </div>
            ) : (
              <ConnectRepositoryForm projectId={projectId} />
            )}
          </div>
        </div>

        <CreateEnvironmentForm projectId={projectId} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
        <div className="rounded-2xl border border-white/10 bg-neutral-900 p-6">
          <h2 className="text-lg font-semibold text-white">Environments</h2>
          <p className="mt-1 text-sm text-neutral-400">
            Deploy targets available for this project.
          </p>

          <div className="mt-6 space-y-3">
            {environments.length === 0 ? (
              <div className="rounded-xl border border-dashed border-white/10 bg-neutral-950 px-4 py-8 text-sm text-neutral-500">
                No environments yet.
              </div>
            ) : (
              environments.map((env) => (
                <div
                  key={env.id}
                  className="rounded-xl border border-white/10 bg-neutral-950 p-4"
                >
                  <div className="text-sm font-medium text-white">{env.name}</div>
                  <div className="mt-1 text-xs uppercase tracking-wide text-neutral-500">
                    {env.type}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <TriggerDeploymentForm
          projectId={projectId}
          environments={environments}
        />
      </section>

      <section className="rounded-2xl border border-white/10 bg-neutral-900 p-6">
        <h2 className="text-lg font-semibold text-white">Deployments</h2>
        <p className="mt-1 text-sm text-neutral-400">
          Recent deployment history for this project.
        </p>

        <div className="mt-6 space-y-3">
          {deployments.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/10 bg-neutral-950 px-4 py-8 text-sm text-neutral-500">
              No deployments yet.
            </div>
          ) : (
            deployments.map((deployment) => (
              <Link
                key={deployment.id}
                href={`/deployments/${deployment.id}`}
                className="block rounded-xl border border-white/10 bg-neutral-950 p-4 transition hover:border-neutral-600"
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="text-sm font-medium text-white">
                      {deployment.imageTag}
                    </div>
                    <div className="mt-1 text-xs text-neutral-500">
                      {deployment.commitSha}
                    </div>
                  </div>

                  <div className="rounded-full border border-white/10 px-3 py-1 text-xs text-neutral-300">
                    {deployment.status}
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </section>
    </div>
  );
}