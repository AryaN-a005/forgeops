import { Worker } from 'bullmq';
import { DeploymentStatus, LogLevel } from '../generated/prisma/client';
import { createRedisConnection } from '../lib/redis.js';
import { prisma } from '../lib/prisma.js';
import {
  DEPLOYMENT_QUEUE_NAME,
  type DeploymentJobData,
} from '../queues/deploymentQueue.js';
import { dockerService } from '../services/dockerService.js';
import { kubernetesService } from '../services/kubernetesService.js';

const createDeploymentLog = async (
  deploymentId: string,
  level: LogLevel,
  message: string
) => {
  return prisma.log.create({
    data: {
      deploymentId,
      level,
      message,
    },
  });
};

const sanitizeName = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50);

const worker = new Worker<DeploymentJobData>(
  DEPLOYMENT_QUEUE_NAME,
  async (job) => {
    const { deploymentId } = job.data;

    const deployment = await prisma.deployment.findUnique({
      where: { id: deploymentId },
      include: {
        project: {
          include: {
            repository: true,
            organization: true,
          },
        },
        environment: true,
        deployedBy: true,
        cluster: true,
        namespace: true,
      },
    });

    if (!deployment) {
      throw new Error(`Deployment ${deploymentId} not found`);
    }

    if (!deployment.project.repository) {
      throw new Error('No repository connected to this project');
    }

    await prisma.deployment.update({
      where: { id: deploymentId },
      data: {
        status: DeploymentStatus.RUNNING,
      },
    });

    await createDeploymentLog(
      deploymentId,
      LogLevel.INFO,
      `Deployment started for project ${deployment.project.name} in environment ${deployment.environment.name}`
    );

    const repository = deployment.project.repository;

    const dockerResult = await dockerService.buildAndMaybePush({
      repoUrl: repository.repoUrl,
      branch: repository.defaultBranch,
      repoName: repository.repoName,
      tag: deployment.imageTag,
      onLog: async (message) => {
        await createDeploymentLog(deploymentId, LogLevel.INFO, message);
      },
    });

    await createDeploymentLog(
      deploymentId,
      LogLevel.INFO,
      `Docker image ready: ${dockerResult.imageRef}`
    );

    if (deployment.clusterId && deployment.namespaceId && deployment.namespace) {
      const deploymentName = sanitizeName(
        `${deployment.project.name}-${deployment.environment.name}`
      );

      const rolloutResult = await kubernetesService.deployImage({
        clusterId: deployment.clusterId,
        namespaceName: deployment.namespace.name,
        deploymentName,
        imageRef: dockerResult.imageRef,
        onLog: async (message) => {
          await createDeploymentLog(deploymentId, LogLevel.INFO, message);
        },
      });

      await createDeploymentLog(
        deploymentId,
        LogLevel.INFO,
        `Kubernetes rollout successful: deployment/${rolloutResult.deploymentName} in namespace ${rolloutResult.namespace}`
      );
    } else {
      await createDeploymentLog(
        deploymentId,
        LogLevel.INFO,
        'No cluster/namespace target configured; marking deployment successful after image build'
      );
    }

    await prisma.deployment.update({
      where: { id: deploymentId },
      data: {
        status: DeploymentStatus.SUCCESS,
      },
    });

    await createDeploymentLog(
      deploymentId,
      LogLevel.INFO,
      `Deployment completed successfully`
    );

    return {
      deploymentId,
      imageRef: dockerResult.imageRef,
      pushed: dockerResult.pushed,
      simulated: dockerResult.simulated,
      status: DeploymentStatus.SUCCESS,
    };
  },
  {
    connection: createRedisConnection(),
    concurrency: 3,
  }
);

worker.on('ready', () => {
  console.log('✅ Deployment worker is ready');
});

worker.on('completed', (job) => {
  console.log(`✅ Deployment job completed: ${job.id}`);
});

worker.on('failed', async (job, error) => {
  console.error(`❌ Deployment job failed: ${job?.id}`, error);

  const deploymentId = job?.data?.deploymentId;
  if (!deploymentId) return;

  try {
    await prisma.deployment.update({
      where: { id: deploymentId },
      data: {
        status: DeploymentStatus.FAILED,
      },
    });

    await createDeploymentLog(
      deploymentId,
      LogLevel.ERROR,
      `Deployment failed: ${error.message}`
    );
  } catch (updateError) {
    console.error('Failed to mark deployment as FAILED', updateError);
  }
});

process.on('SIGINT', async () => {
  await worker.close();
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await worker.close();
  await prisma.$disconnect();
  process.exit(0);
});