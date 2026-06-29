/**
 * Pure structural router classification for Developer Portal v3.
 *
 * Input is ONLY the pathname. No headers, no env, no route params, and the
 * query string is ignored. Keeping this pure means routing decisions are
 * exhaustively unit-testable and request state can never leak into them.
 *
 * Branch modes:
 *  - "v3"     render the v3 shell (the page body is v2 or v3 per the
 *                    per-route page shim; compat routes pass V3 = null)
 *  - "public-exempt" unauthenticated public surface (kiosk); never v3
 *  - "v2"            stays on the v2 experience (API + routes outside v3)
 */
export type PortalV3RouteMode = "v3" | "public-exempt" | "v2";

/**
 * Classify a pathname into its v3 branch mode by its first path segment.
 *
 * Pure: the query string is stripped and the path is split into segments, so
 * only the structural shape decides the mode — `?foo=bar` can never change it,
 * and matching on a whole segment means `/kioskfoo` is NOT treated as `/kiosk`.
 */
export function getPortalV3RouteMode(pathname: string): PortalV3RouteMode {
  const path = pathname.split("?")[0];
  const [first, second] = path.split("/").filter(Boolean);

  // Public, unauthenticated kiosk — never branched into v3.
  if (first === "kiosk") return "public-exempt";

  // API routes are never UI-branched.
  if (first === "api") return "v2";

  // /profile/** (account: User profile / Teams / Danger zone) renders the v2
  // account pages inside a minimal v3 chrome (ProfileLayoutV3 — a close-X back
  // to the main app). Marked v3 so the (portal) Header gate hands chrome over
  // to that layout instead of drawing the v2 Header.
  if (first === "profile") return "v3";

  // A team page needs a team-id segment; the bare /teams index stays v2.
  if (first === "teams" && second) return "v3";

  return "v2";
}

/** The v3 chrome (sidebar/team switcher/header) wraps every v3 route. */
export function shouldRenderPortalV3Shell(pathname: string): boolean {
  return getPortalV3RouteMode(pathname) === "v3";
}
