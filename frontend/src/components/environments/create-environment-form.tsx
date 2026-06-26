'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createEnvironment } from '../../lib/api/environments';
import { ApiClientError } from '../../lib/api/client';

type Props = {
  projectId: string;
};

export function CreateEnvironmentForm({ projectId }: Props) {
  const router = useRouter();

  const [name, setName] = useState('');
  const [type, setType] = useState<'DEVELOPMENT' | 'STAGING' | 'PRODUCTION'>('STAGING');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await createEnvironment({
        projectId,
        name: name.trim(),
        type,
      });

      setName('');
      setType('STAGING');
      router.refresh();
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message);
      } else {
        setError('Failed to create environment');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-neutral-900 p-6">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-white">Create environment</h2>
        <p className="mt-1 text-sm text-neutral-400">
          Add a deployable environment for this project.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-neutral-200">
            Environment name
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="staging"
            className="w-full rounded-xl border border-white/10 bg-neutral-950 px-4 py-3 text-sm text-white outline-none"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-neutral-200">
            Type
          </label>
          <select
            value={type}
            onChange={(e) =>
              setType(e.target.value as 'DEVELOPMENT' | 'STAGING' | 'PRODUCTION')
            }
            className="w-full rounded-xl border border-white/10 bg-neutral-950 px-4 py-3 text-sm text-white outline-none"
          >
            <option value="DEVELOPMENT">Development</option>
            <option value="STAGING">Staging</option>
            <option value="PRODUCTION">Production</option>
          </select>
        </div>

        {error ? (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center justify-center rounded-xl bg-white px-4 py-3 text-sm font-medium text-black transition hover:bg-neutral-200 disabled:opacity-60"
        >
          {submitting ? 'Creating...' : 'Create environment'}
        </button>
      </form>
    </div>
  );
}