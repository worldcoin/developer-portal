import { OpenSearchClient } from "@/lib/opensearch";
import { Redis, Cluster as RedisCluster } from "ioredis";

type Messages = typeof en;

declare global {
  var RedisClient: Redis | RedisCluster | undefined;
  var OpenSearchClient: OpenSearchClient | undefined;
}
