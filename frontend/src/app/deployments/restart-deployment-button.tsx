'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { restartDeployment } from '../../lib/api/deployments';
import { ApiClientError } from '../../lib/api/client';

type Props = {
  deploymentId: string;
};

export function RestartDeploymentButton({ deploymentId }: Props) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRestart = async () => {
    setSubmitting(true);
    setError(null);

    try {
      await restartDeployment(deploymentId);
      router.refresh();
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message);
      } else {
        setError('Failed to restart deployment');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={handleRestart}
        disabled={submitting}
        className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-neutral-900 px-4 py-3 text-sm font-medium text-white transition hover:border-neutral-500 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? 'Restarting...' : 'Restart deployment'}
      </button>

      {error ? (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      ) : null}
    </div>
  );
}