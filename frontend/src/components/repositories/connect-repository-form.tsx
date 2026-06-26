'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createRepository } from '../../lib/api/repositories';
import { ApiClientError } from '../../lib/api/client';

type Props = {
  projectId: string;
};

export function ConnectRepositoryForm({ projectId }: Props) {
  const router = useRouter();

  const [provider, setProvider] = useState<'GITHUB' | 'GITLAB' | 'BITBUCKET'>('GITHUB');
  const [repoUrl, setRepoUrl] = useState('');
  const [repoName, setRepoName] = useState('');
  const [defaultBranch, setDefaultBranch] = useState('main');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await createRepository({
        projectId,
        provider,
        repoUrl: repoUrl.trim(),
        repoName: repoName.trim(),
        defaultBranch: defaultBranch.trim() || 'main',
      });

      setRepoUrl('');
      setRepoName('');
      setDefaultBranch('main');
      router.refresh();
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message);
      } else {
        setError('Failed to connect repository');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-neutral-900 p-6">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-white">Connect repository</h2>
        <p className="mt-1 text-sm text-neutral-400">
          Link a source repository to this project.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-neutral-200">
            Provider
          </label>
          <select
            value={provider}
            onChange={(e) =>
              setProvider(e.target.value as 'GITHUB' | 'GITLAB' | 'BITBUCKET')
            }
            className="w-full rounded-xl border border-white/10 bg-neutral-950 px-4 py-3 text-sm text-white outline-none"
          >
            <option value="GITHUB">GitHub</option>
            <option value="GITLAB">GitLab</option>
            <option value="BITBUCKET">Bitbucket</option>
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-neutral-200">
            Repository URL
          </label>
          <input
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            placeholder="https://github.com/your-org/forgeops"
            className="w-full rounded-xl border border-white/10 bg-neutral-950 px-4 py-3 text-sm text-white outline-none"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-neutral-200">
            Repository name
          </label>
          <input
            value={repoName}
            onChange={(e) => setRepoName(e.target.value)}
            placeholder="forgeops"
            className="w-full rounded-xl border border-white/10 bg-neutral-950 px-4 py-3 text-sm text-white outline-none"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-neutral-200">
            Default branch
          </label>
          <input
            value={defaultBranch}
            onChange={(e) => setDefaultBranch(e.target.value)}
            placeholder="main"
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
          {submitting ? 'Connecting...' : 'Connect repository'}
        </button>
      </form>
    </div>
  );
}