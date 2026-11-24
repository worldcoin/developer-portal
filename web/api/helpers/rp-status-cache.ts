function cacheKeys(rpId: string): [string, string] {
  const cacheKey = `rp_status:v2:${rpId}`;
  // Hash the generation key into the existing cache key's Redis Cluster slot.
  return [cacheKey, `rp_status:generation:{${cacheKey}}`];
}

export async function readRpStatusCache(rpId: string) {
  const values = await global.RedisClient?.mget(...cacheKeys(rpId));
  return values ? { value: values[0], generation: values[1] ?? "0" } : null;
}

export async function writeRpStatusCache(
  rpId: string,
  generation: string,
  value: string,
  ttl: number,
) {
  return global.RedisClient?.eval(
    `if (redis.call('GET', KEYS[2]) or '0') ~= ARGV[1] then
       return 0
     end
     redis.call('SET', KEYS[1], ARGV[2], 'EX', ARGV[3])
     return 1`,
    2,
    ...cacheKeys(rpId),
    generation,
    value,
    String(ttl),
  );
}

export async function invalidateRpStatusCache(rpId: string) {
  return global.RedisClient?.eval(
    `redis.call('INCR', KEYS[2])
     return redis.call('DEL', KEYS[1])`,
    2,
    ...cacheKeys(rpId),
  );
}
