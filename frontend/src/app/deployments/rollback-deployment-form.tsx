'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { rollbackDeployment } from '../../lib/api/deployments';
import { ApiClientError } from '../../lib/api/client';

type Props = {
  deploymentId: string;
};

export function RollbackDeploymentForm({ deploymentId }: Props) {
  const router = useRouter();

  const [toRevision, setToRevision] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRollback = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const revision =
        toRevision.trim().length > 0 ? Number(toRevision.trim()) : undefined;

      await rollbackDeployment(
        deploymentId,
        Number.isFinite(revision) ? revision : undefined
      );

      setToRevision('');
      router.refresh();
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message);
      } else {
        setError('Failed to rollback deployment');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-neutral-900 p-6">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-white">Rollback</h2>
        <p className="mt-1 text-sm text-neutral-400">
          Roll back the deployment to the previous or a specific revision.
        </p>
      </div>

      <form onSubmit={handleRollback} className="space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-neutral-200">
            Revision (optional)
          </label>
          <input
            value={toRevision}
            onChange={(e) => setToRevision(e.target.value)}
            placeholder="Leave empty for previous revision"
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
          {submitting ? 'Rolling back...' : 'Rollback deployment'}
        </button>
      </form>
    </div>
  );
}