/**
 * Most-recently-used app resolution for the v3 landing flow.
 *
 * The resolver is pure (no I/O) so the redirect chokepoints can share one
 * implementation. The MRU itself is persisted in a cookie keyed by team, so it
 * is per-(user-device, team) and never points across teams. The thin cookie
 * read/write happens at the call sites via next/headers; everything here is
 * testable in isolation.
 */

export const MRU_COOKIE = "portal_v3_mru";

export type MruApp = { id: string; created_at: string };

export type LandingTarget =
  | { type: "app"; appId: string }
  | { type: "grid" };

/**
 * Resolve which app a team should land on. Fallback chain:
 *   1. the stored MRU app, if it still exists and is accessible in THIS team;
 *   2. otherwise the most-recently-created accessible app;
 *   3. otherwise the apps grid (create-your-first-app empty state).
 */
export const resolveLandingApp = (args: {
  apps: MruApp[];
  mruAppId?: string;
}): LandingTarget => {
  const { apps, mruAppId } = args;

  if (mruAppId && apps.some((app) => app.id === mruAppId)) {
    return { type: "app", appId: mruAppId };
  }

  if (apps.length > 0) {
    const newest = apps.reduce((a, b) => (a.created_at >= b.created_at ? a : b));
    return { type: "app", appId: newest.id };
  }

  return { type: "grid" };
};

/** Parse the MRU cookie (a teamId → appId map). Tolerates missing/garbage. */
export const parseMruCookie = (
  raw: string | undefined,
): Record<string, string> => {
  if (!raw) return {};
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }
    // Keep only string→string entries.
    return Object.fromEntries(
      Object.entries(parsed as Record<string, unknown>).filter(
        ([, v]) => typeof v === "string",
      ),
    ) as Record<string, string>;
  } catch {
    return {};
  }
};

/** The MRU app id stored for a team, if any. */
export const mruAppForTeam = (
  raw: string | undefined,
  teamId: string,
): string | undefined => parseMruCookie(raw)[teamId];

/** Serialize an updated MRU cookie value with `teamId → appId` set. */
export const withMruApp = (
  raw: string | undefined,
  teamId: string,
  appId: string,
): string => JSON.stringify({ ...parseMruCookie(raw), [teamId]: appId });
