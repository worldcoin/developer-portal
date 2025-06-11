import { Redis, Cluster as RedisCluster } from "ioredis";

type Messages = typeof en;

declare global {
  var RedisClient: Redis | RedisCluster | undefined;

  namespace NodeJS {
    interface ProcessEnv {
      NEXT_PUBLIC_APP_ENV?: "dev" | "staging" | "production";
    }
  }
}
