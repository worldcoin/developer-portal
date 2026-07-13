import { lifetimeBucketBounds, weekBucketBounds } from "@/lib/day-buckets";

it("returns 8 local-midnight bounds ending at today and tomorrow", () => {
  const bounds = weekBucketBounds(new Date(2026, 5, 15, 9, 30, 0));

  expect(bounds).toHaveLength(8);
  expect(bounds[6]).toBe(new Date(2026, 5, 15).toISOString());
  expect(bounds[7]).toBe(new Date(2026, 5, 16).toISOString());
});

it("splits an entity lifetime into 7 equal buckets ending tomorrow", () => {
  const createdAt = new Date(2026, 0, 1, 12);
  const bounds = lifetimeBucketBounds(createdAt, new Date(2026, 0, 8, 9, 30));

  expect(bounds).toHaveLength(8);
  expect(bounds[0]).toBe(createdAt.toISOString());
  expect(bounds[7]).toBe(new Date(2026, 0, 9).toISOString());

  const widths = bounds.slice(1).map((bound, index) => {
    return new Date(bound).getTime() - new Date(bounds[index]).getTime();
  });
  expect(Math.max(...widths) - Math.min(...widths)).toBeLessThanOrEqual(1);
});
