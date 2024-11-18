import { Redis, Cluster as RedisCluster } from "ioredis";

type Messages = typeof en;

declare global {
  var RedisClient: Redis | RedisCluster | undefined;
}
