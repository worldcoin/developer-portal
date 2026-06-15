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
 * The full set of base URLs the app is served from (primary `APP_BASE_URL` plus
 * its sibling-domain variant). Passed to the Auth0 v4 `appBaseUrl` option in
 * allow-list mode so callback/logout redirects use the host the request actually
 * came in on — preserving the v3 behaviour of deriving `redirect_uri` from the
 * request host. Returns `undefined` when `APP_BASE_URL` is unset so the SDK can
 * fall back to inferring the host.
 */
export const getAllowedAppBaseUrls = (): string | string[] | undefined => {
  const primary = process.env.APP_BASE_URL;
  if (!primary) return undefined;
  const sibling = siblingOrigin(primary);
  return sibling ? [primary, sibling] : primary;
};
