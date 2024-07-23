import { Redis, Cluster as RedisCluster } from "ioredis";

export const createRedisClient = (params: {
  password?: string;
  lazyConnect?: boolean;
  url: string;
  username: string;
}): Redis | RedisCluster => {
  const isLocalHost = params.url.includes("localhost");

  if (isLocalHost) {
    const url = new URL(`redis://${params.url}`);
    const host = url.hostname;
    const port = url.port ? parseInt(url.port) : 6379;

    // ANCHOR: Single instance client for local development
    return new Redis({
      host,
      port,
      username: params.username,
      password: params.password,
      maxRetriesPerRequest: 0,
    });
  } else {
    // ANCHOR: Cluster client for AWS ElastiCache
    return new RedisCluster([params.url], {
      ...(params.lazyConnect ? { lazyConnect: params.lazyConnect } : {}),
      redisOptions: {
        username: params.username,
        password: params.password,
        tls: {},
      },
      slotsRefreshTimeout: 3000,
      dnsLookup: (address, callback) => callback(null, address), // Required when the host name is not an IP address,
    });
  }
};
