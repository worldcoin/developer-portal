import { relativeTimeShort } from "@/lib/relative-time-short";

it("formats abbreviated relative time across unit boundaries", () => {
  const now = new Date("2026-06-15T12:00:00Z");
  const ago = (ms: number) => new Date(now.getTime() - ms);

  expect(relativeTimeShort(ago(5_000), now)).toBe("just now");
  expect(relativeTimeShort(ago(90_000), now)).toBe("1m ago");
  expect(relativeTimeShort(ago(3 * 86_400_000), now)).toBe("3d ago");
});
