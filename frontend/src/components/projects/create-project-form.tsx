'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createProject } from '../../lib/api/projects';
import { ApiClientError } from '../../lib/api/client';

type Props = {
  organizationId: string;
};

export function CreateProjectForm({ organizationId }: Props) {
  const router = useRouter();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await createProject({
        name: name.trim(),
        description: description.trim() || undefined,
        organizationId,
      });

      setName('');
      setDescription('');
      router.refresh();
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message);
      } else {
        setError('Failed to create project');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-neutral-900 p-6">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-white">Create project</h2>
        <p className="mt-1 text-sm text-neutral-400">
          Add a new deployable project inside this organization.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-neutral-200">
            Project name
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="ForgeOps API"
            className="w-full rounded-xl border border-white/10 bg-neutral-950 px-4 py-3 text-sm text-white outline-none transition focus:border-neutral-500"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-neutral-200">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Backend deployment service"
            rows={4}
            className="w-full rounded-xl border border-white/10 bg-neutral-950 px-4 py-3 text-sm text-white outline-none transition focus:border-neutral-500"
          />
        </div>

        {error ? (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center justify-center rounded-xl bg-white px-4 py-3 text-sm font-medium text-black transition hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? 'Creating...' : 'Create project'}
        </button>
      </form>
    </div>
  );
}