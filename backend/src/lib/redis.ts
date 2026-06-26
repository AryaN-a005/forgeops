import IORedis from 'ioredis';

const getRedisUrl = () => {
  const redisUrl = process.env.REDIS_URL;

  if (!redisUrl) {
    throw new Error('REDIS_URL is not configured');
  }

  return redisUrl;
};

export const createRedisConnection = () => {
  return new IORedis(getRedisUrl(), {
    maxRetriesPerRequest: null,
  });
};