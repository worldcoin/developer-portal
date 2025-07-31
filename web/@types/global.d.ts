import { OpenSearchClient } from "@/lib/opensearch";
import { ParameterStore } from "@/lib/parameter-store";
import { Redis, Cluster as RedisCluster } from "ioredis";

type Messages = typeof en;

declare global {
  var RedisClient: Redis | RedisCluster | undefined;
  var OpenSearchClient: OpenSearchClient | undefined;
  var ParameterStore: ParameterStore | undefined;
}
