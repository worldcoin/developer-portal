// The portal is served from both the worldcoin.org and world.org variants of the
// same hostname. These helpers centralise the host handling so the CSP allow-list
// (middleware) and the Auth0 v4 redirect host allow-list (lib/auth0) agree.

/**
 * Given one origin, return the sibling origin on the other domain variant
 * (worldcoin.org <-> world.org), or undefined if the host isn't one of those.
 */
export const siblingOrigin = (raw: string | undefined): string | undefined => {
  if (!raw) return undefined;
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return undefined;
  }
  const { hostname } = parsed;
  if (hostname.endsWith(".worldcoin.org")) {
    parsed.hostname = `${hostname.slice(0, -".worldcoin.org".length)}.world.org`;
  } else if (hostname.endsWith(".world.org")) {
    parsed.hostname = `${hostname.slice(0, -".world.org".length)}.worldcoin.org`;
  } else {
    return undefined;
  }
  return parsed.origin;
};

/**
 * The canonical app origin (`APP_BASE_URL`, e.g. `https://developer.worldcoin.org`),
 * or `undefined` when unset. It is the primary entry of the `appBaseUrl` allow-list
 * and the redirect target for auth requests that arrive on a non-allow-listed
 * origin (see `proxy.ts`).
 */
export const getPrimaryAppBaseUrl = (): string | undefined =>
  process.env.APP_BASE_URL?.split(",")[0]?.trim() || undefined;

/**
 * The set of base URLs the portal is served from: the canonical `APP_BASE_URL`
 * plus its sibling-domain variant. Passed to the Auth0 v4 `appBaseUrl` option so
 * the SDK builds callback/logout redirects against the host the request came in
 * on. This keeps the OAuth transaction cookie and the callback on the same
 * registrable domain for both public hosts (worldcoin.org and world.org are
 * distinct registrable domains, so a cookie set on one is not sent to the other).
 * Returns `undefined` when `APP_BASE_URL` is unset.
 */
export const getAllowedAppBaseUrls = (): string | string[] | undefined => {
  const primary = getPrimaryAppBaseUrl();
  if (!primary) return undefined;
  const sibling = siblingOrigin(primary);
  return sibling ? [primary, sibling] : primary;
};
