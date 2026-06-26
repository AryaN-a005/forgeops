'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createOrganization } from '../../lib/api/organizations';
import { ApiClientError } from '../../lib/api/client';

export function CreateOrganizationForm() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateSlug = (value: string) =>
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');

  const handleNameChange = (value: string) => {
    setName(value);
    if (!slug) {
      setSlug(generateSlug(value));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await createOrganization({
        name: name.trim(),
        slug: slug.trim(),
      });

      setName('');
      setSlug('');
      router.refresh();
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message);
      } else {
        setError('Failed to create organization');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-neutral-900 p-6 shadow-sm">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-white">Create organization</h2>
        <p className="mt-1 text-sm text-neutral-400">
          Start by creating a workspace for your projects.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-neutral-200">
            Organization name
          </label>
          <input
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="Acme Org"
            className="w-full rounded-xl border border-white/10 bg-neutral-950 px-4 py-3 text-sm text-white outline-none transition focus:border-neutral-500"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-neutral-200">
            Slug
          </label>
          <input
            value={slug}
            onChange={(e) => setSlug(generateSlug(e.target.value))}
            placeholder="acme-org"
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
          {submitting ? 'Creating...' : 'Create organization'}
        </button>
      </form>
    </div>
  );
}