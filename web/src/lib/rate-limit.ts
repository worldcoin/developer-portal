import type { NextApiResponse } from "next";
import { LRUCache } from "lru-cache";

type Options = {
  maxItems: number;
  ttl: number;
};

export default function rateLimit(options: Options) {
  const cache = new LRUCache({
    max: options.maxItems,
    ttl: options.ttl,
  });

  return {
    check: (res: NextApiResponse, limit: number, token: string) =>
      new Promise<void>((resolve, reject) => {
        const tokenCount = (cache.get(token) as number[]) || [0];
        if (tokenCount[0] === 0) {
          cache.set(token, tokenCount);
        }
        tokenCount[0] += 1;

        const currentUsage = tokenCount[0];
        const isRateLimited = currentUsage > limit;
        res.setHeader("X-RateLimit-Limit", limit);
        res.setHeader(
          "X-RateLimit-Remaining",
          isRateLimited ? 0 : limit - currentUsage
        );

        return isRateLimited ? reject() : resolve();
      }),
  };
}
