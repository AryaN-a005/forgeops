import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getOrganizationById } from '../../../lib/api/organizations';
import { getProjectsByOrganization } from '../../../lib/api/projects';
import { CreateProjectForm } from '../../../components/projects/create-project-form';

type Props = {
  params: Promise<{
    orgId: string;
  }>;
};

export default async function OrganizationDetailPage({ params }: Props) {
  const { orgId } = await params;

  let organization;
  let projects;

  try {
    organization = await getOrganizationById(orgId);
    projects = await getProjectsByOrganization(orgId);
  } catch {
    notFound();
  }

  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="mb-2 text-sm font-medium uppercase tracking-wide text-neutral-500">
            Organization
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-white">
            {organization.name}
          </h1>
          <p className="mt-2 text-sm text-neutral-400">
            Workspace slug: {organization.slug}
          </p>
        </div>

        <Link
          href="/organizations"
          className="inline-flex items-center rounded-xl border border-white/10 bg-neutral-900 px-4 py-2 text-sm text-neutral-300 transition hover:border-neutral-500 hover:text-white"
        >
          Back to organizations
        </Link>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_1.5fr]">
        <CreateProjectForm organizationId={orgId} />

        <div className="rounded-2xl border border-white/10 bg-neutral-900 p-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-white">Projects</h2>
            <p className="mt-1 text-sm text-neutral-400">
              Projects deployed inside this organization.
            </p>
          </div>

          {projects.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/10 bg-neutral-950 px-4 py-8 text-sm text-neutral-500">
              No projects yet. Create one to continue the deployment workflow.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {projects.map((project) => (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="rounded-2xl border border-white/10 bg-neutral-950 p-5 transition hover:border-neutral-600"
                >
                  <div className="text-base font-medium text-white">
                    {project.name}
                  </div>

                  <div className="mt-2 min-h-[40px] text-sm text-neutral-400">
                    {project.description || 'No description provided.'}
                  </div>

                  <div className="mt-4 text-xs uppercase tracking-wide text-neutral-600">
                    Open project
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}