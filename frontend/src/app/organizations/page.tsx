import Link from 'next/link';
import { CreateOrganizationForm } from '../../components/organizations/create-organization-form';
import { getOrganizations } from '../../lib/api/organizations';

export default async function OrganizationsPage() {
  const organizations = await getOrganizations();

  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="mb-2 text-sm font-medium uppercase tracking-wide text-neutral-500">
            Organizations
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-white">
            Workspaces
          </h1>
          <p className="mt-2 text-sm text-neutral-400">
            Create and manage the top-level spaces that contain your projects.
          </p>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_1.4fr]">
        <CreateOrganizationForm />

        <div className="rounded-2xl border border-white/10 bg-neutral-900 p-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-white">Your organizations</h2>
            <p className="mt-1 text-sm text-neutral-400">
              Select an organization to view its projects.
            </p>
          </div>

          {organizations.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/10 bg-neutral-950 px-4 py-8 text-sm text-neutral-500">
              No organizations found yet.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {organizations.map((org) => (
                <Link
                  key={org.id}
                  href={`/organizations/${org.id}`}
                  className="rounded-2xl border border-white/10 bg-neutral-950 p-5 transition hover:border-neutral-600"
                >
                  <div className="text-base font-medium text-white">{org.name}</div>
                  <div className="mt-1 text-sm text-neutral-500">{org.slug}</div>
                  <div className="mt-4 text-xs uppercase tracking-wide text-neutral-600">
                    Open workspace
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