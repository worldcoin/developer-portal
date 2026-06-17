// The portal is served from both the worldcoin.org and world.org variants of the
// same hostname. `siblingOrigin` centralises that mapping for the middleware CSP
// allow-list (so assets/connections from either origin are allowed).

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
