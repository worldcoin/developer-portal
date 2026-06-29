/**
 * Pure structural router classification for Developer Portal v3.
 *
 * Input is ONLY the pathname. No headers, no env, no route params, and the
 * query string is ignored. Keeping this pure means routing decisions are
 * exhaustively unit-testable and request state can never leak into them.
 *
 * Branch modes:
 *  - "v3-active"     render the v3 shell AND the v3 page
 *  - "v2-compat"     render the v2 page body INSIDE the v3 shell
 *  - "public-exempt" unauthenticated public surface (kiosk); never v3
 *  - "redirect-alias" legacy path that will redirect into a v3 location
 *  - "unbranched"    untouched (API + everything outside the branched trees)
 */
export type PortalV3RouteMode =
  | "v3-active"
  | "v2-compat"
  | "public-exempt"
  | "redirect-alias"
  | "unbranched";

/**
 * Ordered, most-specific-first rules. The first match wins. The compat / alias
 * rules MUST precede the broad /teams catch because they live under it.
 *
 * `[^/]+` matches a single path segment (a team id or app id) and never spans
 * a `/`, which is what keeps `/actions` from matching `/world-id-actions`
 * (the latter is a distinct segment and is left to the /teams v3-active rule).
 * Trailing `(?:/|$)` anchors each rule to a full segment boundary.
 */
const RULES: Array<{ test: RegExp; mode: PortalV3RouteMode }> = [
  // Public, unauthenticated kiosk — never branched into v3.
  { test: /^\/kiosk(?:\/|$)/, mode: "public-exempt" },

  // API routes are never UI-branched.
  { test: /^\/api(?:\/|$)/, mode: "unbranched" },

  // v2-compat: the v2 page body rendered inside the v3 shell.
  // `actions` is a standalone segment — `[^/]+` cannot cross the `/` in
  // `world-id-actions`, so this rule does NOT match /world-id-actions.
  {
    test: /^\/teams\/[^/]+\/apps\/[^/]+\/actions(?:\/|$)/,
    mode: "v2-compat",
  },
  {
    test: /^\/teams\/[^/]+\/apps\/[^/]+\/sign-in-with-world-id(?:\/|$)/,
    mode: "v2-compat",
  },

  // redirect-alias: legacy paths that redirect into v3 destinations.
  {
    test: /^\/teams\/[^/]+\/apps\/[^/]+\/transactions(?:\/|$)/,
    mode: "redirect-alias",
  },
  {
    test: /^\/teams\/[^/]+\/apps\/[^/]+\/notifications(?:\/|$)/,
    mode: "redirect-alias",
  },

  // v3-active: the new shell + new pages.
  { test: /^\/teams\/[^/]+(?:\/|$)/, mode: "v3-active" },

  // /profile/** (account: User profile / Teams / Danger zone) renders the v2
  // account pages inside a minimal v3 chrome (ProfileLayoutV3 — a close-X back
  // to the main app). Marked v3-active so the (portal) Header gate hands chrome
  // over to that layout instead of drawing the v2 Header.
  { test: /^\/profile(?:\/|$)/, mode: "v3-active" },
];

/**
 * Classify a pathname into its v3 branch mode. Pure: query string is stripped
 * before matching so `?foo=bar` can never change the result.
 */
export function getPortalV3RouteMode(pathname: string): PortalV3RouteMode {
  const path = pathname.split("?")[0];
  for (const rule of RULES) {
    if (rule.test.test(path)) {
      return rule.mode;
    }
  }
  return "unbranched";
}

/** The v3 chrome (sidebar/team switcher/header) wraps both v3 and compat pages. */
export function shouldRenderPortalV3Shell(pathname: string): boolean {
  const mode = getPortalV3RouteMode(pathname);
  return mode === "v3-active" || mode === "v2-compat";
}

/** A v3 page body is rendered only for fully-branched v3-active routes. */
export function shouldRenderPortalV3Page(pathname: string): boolean {
  return getPortalV3RouteMode(pathname) === "v3-active";
}
