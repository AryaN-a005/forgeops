import { createHmac, timingSafeEqual } from 'node:crypto';
import { EnvironmentType, GitProvider } from '../generated/prisma/client';
import { prisma } from '../lib/prisma.js';
import { ApiError } from '../middleware/errorHandler.js';
import { deploymentService } from './deploymentService.js';

type GitHubBranch = {
  name: string;
  protected: boolean;
  commitSha: string;
  commitUrl: string;
  isDefault: boolean;
};

type PushWebhookResult = {
  matched: boolean;
  autoDeployed: boolean;
  branch: string;
  commitSha: string | null;
  repository: string;
  projectId?: string;
  environmentId?: string;
  deploymentId?: string;
  reason?: string;
};

const getGitHubApiBaseUrl = () =>
  process.env.GITHUB_API_BASE_URL?.trim() || 'https://api.github.com';

const getGitHubHeaders = (): HeadersInit => {
  const token = process.env.GITHUB_TOKEN?.trim();

  return {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'ForgeOps',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const parseGitHubRepoFromUrl = (repoUrl: string) => {
  const trimmed = repoUrl.trim();

  const patterns = [
    /^https?:\/\/github\.com\/([^/]+)\/([^/]+?)(?:\.git)?\/?$/i,
    /^git@github\.com:([^/]+)\/([^/]+?)(?:\.git)?$/i,
  ];

  for (const pattern of patterns) {
    const match = trimmed.match(pattern);
    if (match) {
      return {
        owner: match[1],
        repo: match[2],
      };
    }
  }

  throw new ApiError(
    400,
    'Repository URL is not a valid GitHub repository URL',
    'INVALID_GITHUB_REPO_URL'
  );
};

const normalizeGitHubRepoUrl = (repoUrl: string) => {
  const { owner, repo } = parseGitHubRepoFromUrl(repoUrl);
  return `https://github.com/${owner}/${repo}`.toLowerCase();
};

const verifyGitHubSignature = (rawBody: string, signatureHeader: string) => {
  const secret = process.env.GITHUB_WEBHOOK_SECRET;

  if (!secret) {
    throw new ApiError(
      500,
      'GITHUB_WEBHOOK_SECRET is not configured',
      'GITHUB_WEBHOOK_SECRET_MISSING'
    );
  }

  const expected = `sha256=${createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex')}`;

  const expectedBuffer = Buffer.from(expected);
  const receivedBuffer = Buffer.from(signatureHeader);

  if (
    expectedBuffer.length !== receivedBuffer.length ||
    !timingSafeEqual(expectedBuffer, receivedBuffer)
  ) {
    throw new ApiError(401, 'Invalid GitHub webhook signature', 'INVALID_WEBHOOK_SIGNATURE');
  }
};

const getBranchFromRef = (ref: string | undefined) => {
  if (!ref) return '';
  return ref.replace('refs/heads/', '');
};

const getShortSha = (sha: string) => sha.slice(0, 7);

export const githubService = {
  verifyWebhookSignature(rawBody: string, signatureHeader: string) {
    verifyGitHubSignature(rawBody, signatureHeader);
  },

  async getBranchesByProject(projectId: string): Promise<GitHubBranch[]> {
    const repository = await prisma.repository.findUnique({
      where: { projectId },
      select: {
        id: true,
        provider: true,
        repoUrl: true,
        defaultBranch: true,
      },
    });

    if (!repository) {
      throw new ApiError(404, 'Repository not found for project', 'REPOSITORY_NOT_FOUND');
    }

    if (repository.provider !== GitProvider.GITHUB) {
      throw new ApiError(
        400,
        'Repository provider is not GitHub',
        'REPOSITORY_PROVIDER_NOT_GITHUB'
      );
    }

    const { owner, repo } = parseGitHubRepoFromUrl(repository.repoUrl);

    const response = await fetch(
      `${getGitHubApiBaseUrl()}/repos/${owner}/${repo}/branches`,
      {
        headers: getGitHubHeaders(),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new ApiError(
        response.status,
        `Failed to fetch GitHub branches: ${errorText}`,
        'GITHUB_BRANCH_FETCH_FAILED'
      );
    }

    const data = (await response.json()) as Array<{
      name: string;
      protected: boolean;
      commit: {
        sha: string;
        url: string;
      };
    }>;

    return data.map((branch) => ({
      name: branch.name,
      protected: branch.protected,
      commitSha: branch.commit.sha,
      commitUrl: branch.commit.url,
      isDefault: branch.name === repository.defaultBranch,
    }));
  },

  async handlePushWebhook(payload: any): Promise<PushWebhookResult> {
    const branch = getBranchFromRef(payload.ref);
    const commitSha =
      payload.after ||
      payload.head_commit?.id ||
      null;

    const htmlUrl =
      payload.repository?.html_url ||
      payload.repository?.clone_url ||
      (payload.repository?.full_name
        ? `https://github.com/${payload.repository.full_name}`
        : null);

    if (!htmlUrl) {
      throw new ApiError(400, 'Invalid GitHub push payload', 'INVALID_GITHUB_PAYLOAD');
    }

    const normalizedIncomingRepoUrl = normalizeGitHubRepoUrl(htmlUrl);

    const repositories = await prisma.repository.findMany({
      where: {
        provider: GitProvider.GITHUB,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            createdById: true,
            organizationId: true,
          },
        },
      },
    });

    const matchedRepository = repositories.find(
      (repo) => normalizeGitHubRepoUrl(repo.repoUrl) === normalizedIncomingRepoUrl
    );

    if (!matchedRepository) {
      return {
        matched: false,
        autoDeployed: false,
        branch,
        commitSha,
        repository: normalizedIncomingRepoUrl,
        reason: 'No connected ForgeOps project matched this GitHub repository',
      };
    }

    if (!process.env.AUTO_DEPLOY_ON_PUSH || process.env.AUTO_DEPLOY_ON_PUSH !== 'true') {
      return {
        matched: true,
        autoDeployed: false,
        branch,
        commitSha,
        repository: normalizedIncomingRepoUrl,
        projectId: matchedRepository.projectId,
        reason: 'AUTO_DEPLOY_ON_PUSH is disabled',
      };
    }

    if (!commitSha) {
      return {
        matched: true,
        autoDeployed: false,
        branch,
        commitSha: null,
        repository: normalizedIncomingRepoUrl,
        projectId: matchedRepository.projectId,
        reason: 'Push payload did not include a commit SHA',
      };
    }

    if (branch !== matchedRepository.defaultBranch) {
      return {
        matched: true,
        autoDeployed: false,
        branch,
        commitSha,
        repository: normalizedIncomingRepoUrl,
        projectId: matchedRepository.projectId,
        reason: `Push is not on default branch (${matchedRepository.defaultBranch})`,
      };
    }

    const environments = await prisma.environment.findMany({
      where: {
        projectId: matchedRepository.projectId,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    const targetEnvironment =
      environments.find((env) => env.type === EnvironmentType.DEVELOPMENT) ||
      environments.find((env) => env.type === EnvironmentType.STAGING) ||
      environments.find((env) => env.type === EnvironmentType.PRODUCTION) ||
      environments[0];

    if (!targetEnvironment) {
      return {
        matched: true,
        autoDeployed: false,
        branch,
        commitSha,
        repository: normalizedIncomingRepoUrl,
        projectId: matchedRepository.projectId,
        reason: 'No environment exists for this project',
      };
    }

    let actorUserId = matchedRepository.project.createdById;

    if (!actorUserId) {
      const fallbackMembership = await prisma.membership.findFirst({
        where: {
          organizationId: matchedRepository.project.organizationId,
        },
        orderBy: {
          createdAt: 'asc',
        },
        select: {
          userId: true,
        },
      });

      actorUserId = fallbackMembership?.userId ?? null;
    }

    if (!actorUserId) {
      return {
        matched: true,
        autoDeployed: false,
        branch,
        commitSha,
        repository: normalizedIncomingRepoUrl,
        projectId: matchedRepository.projectId,
        environmentId: targetEnvironment.id,
        reason: 'No valid actor user found to attribute deployment',
      };
    }

    const deployment = await deploymentService.create({
      projectId: matchedRepository.projectId,
      environmentId: targetEnvironment.id,
      imageTag: getShortSha(commitSha),
      commitSha,
      deployedById: actorUserId,
    });

    return {
      matched: true,
      autoDeployed: true,
      branch,
      commitSha,
      repository: normalizedIncomingRepoUrl,
      projectId: matchedRepository.projectId,
      environmentId: targetEnvironment.id,
      deploymentId: deployment.id,
    };
  },
};