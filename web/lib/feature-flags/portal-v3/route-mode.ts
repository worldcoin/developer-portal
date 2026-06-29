export type PortalV3RouteMode =
  | "v3-active"
  | "v2-compat"
  | "public-exempt"
  | "redirect-alias"
  | "unbranched";

const stripQuery = (pathname: string): string => pathname.split("?")[0] ?? "";

const isAppRoute = (pathname: string): boolean =>
  /^\/teams\/[^/]+\/apps\/[^/]+(?:\/.*)?$/.test(pathname);

export function getPortalV3RouteMode(
  pathnameWithQuery: string,
): PortalV3RouteMode {
  const pathname = stripQuery(pathnameWithQuery).replace(/\/+$/, "") || "/";

  if (pathname === "/teams" || pathname.startsWith("/api/")) {
    return "unbranched";
  }

  if (/^\/kiosk\/[^/]+\/[^/]+$/.test(pathname)) {
    return "public-exempt";
  }

  if (
    /^\/teams\/[^/]+\/apps\/[^/]+\/(?:transactions\/permissions|transactions|notifications)$/.test(
      pathname,
    )
  ) {
    return "redirect-alias";
  }

  if (
    /^\/teams\/[^/]+\/apps\/[^/]+\/(?:actions|sign-in-with-world-id)(?:\/.*)?$/.test(
      pathname,
    )
  ) {
    return "v2-compat";
  }

  if (
    /^\/teams\/[^/]+(?:\/.*)?$/.test(pathname) ||
    /^\/profile(?:\/.*)?$/.test(pathname)
  ) {
    return isAppRoute(pathname) ||
      pathname.startsWith("/teams/") ||
      pathname.startsWith("/profile")
      ? "v3-active"
      : "unbranched";
  }

  return "unbranched";
}

export function shouldRenderPortalV3Shell(pathname: string): boolean {
  const mode = getPortalV3RouteMode(pathname);
  return mode === "v3-active" || mode === "v2-compat";
}

export function shouldRenderPortalV3Page(pathname: string): boolean {
  return getPortalV3RouteMode(pathname) === "v3-active";
}
