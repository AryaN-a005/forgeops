'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createDeployment } from '../../lib/api/deployments';
import { ApiClientError } from '../../lib/api/client';
import type { Environment } from '../../lib/api/environments';

type Props = {
  projectId: string;
  environments: Environment[];
};

export function TriggerDeploymentForm({ projectId, environments }: Props) {
  const router = useRouter();

  const [environmentId, setEnvironmentId] = useState(environments[0]?.id ?? '');
  const [imageTag, setImageTag] = useState('v1.0.0');
  const [commitSha, setCommitSha] = useState('abc123def456');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await createDeployment({
        projectId,
        environmentId,
        imageTag: imageTag.trim(),
        commitSha: commitSha.trim(),
      });

      router.refresh();
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message);
      } else {
        setError('Failed to trigger deployment');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-neutral-900 p-6">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-white">Trigger deployment</h2>
        <p className="mt-1 text-sm text-neutral-400">
          Start a new deployment for this project.
        </p>
      </div>

      {environments.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/10 bg-neutral-950 px-4 py-6 text-sm text-neutral-500">
          Create an environment before triggering a deployment.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-neutral-200">
              Environment
            </label>
            <select
              value={environmentId}
              onChange={(e) => setEnvironmentId(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-neutral-950 px-4 py-3 text-sm text-white outline-none"
            >
              {environments.map((env) => (
                <option key={env.id} value={env.id}>
                  {env.name} ({env.type})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-neutral-200">
              Image tag
            </label>
            <input
              value={imageTag}
              onChange={(e) => setImageTag(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-neutral-950 px-4 py-3 text-sm text-white outline-none"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-neutral-200">
              Commit SHA
            </label>
            <input
              value={commitSha}
              onChange={(e) => setCommitSha(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-neutral-950 px-4 py-3 text-sm text-white outline-none"
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
            className="inline-flex items-center justify-center rounded-xl bg-white px-4 py-3 text-sm font-medium text-black transition hover:bg-neutral-200 disabled:opacity-60"
          >
            {submitting ? 'Deploying...' : 'Trigger deployment'}
          </button>
        </form>
      )}
    </div>
  );
}