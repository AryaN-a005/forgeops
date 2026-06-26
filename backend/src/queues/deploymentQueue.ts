import { Queue } from 'bullmq';
import { createRedisConnection } from '../lib/redis.js';

export const DEPLOYMENT_QUEUE_NAME = 'deployment-execution';

export type DeploymentJobData = {
  deploymentId: string;
};

export const deploymentQueue = new Queue<DeploymentJobData>(
  DEPLOYMENT_QUEUE_NAME,
  {
    connection: createRedisConnection(),
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
      removeOnComplete: 100,
      removeOnFail: 500,
    },
  }
);

export const enqueueDeploymentJob = async (data: DeploymentJobData) => {
  return deploymentQueue.add('execute-deployment', data, {
    jobId: data.deploymentId,
  });
};