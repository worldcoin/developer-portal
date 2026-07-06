import { logger } from "@/lib/logger";
import { createRemoteJWKSet, jwtVerify } from "jose";
import "server-only";
import { AdminAuthProvider, AdminIdentity } from "../types";

// All Cloudflare Access / Okta specifics live in this file only. The rest of
// the app depends on the generic AdminAuthProvider interface, so a fork can
// drop this provider and plug in a different one via ADMIN_AUTH_PROVIDER.

const ASSERTION_HEADER = "cf-access-jwt-assertion";

let jwks: ReturnType<typeof createRemoteJWKSet> | undefined;

const getJwks = (teamDomain: string) => {
  jwks ??= createRemoteJWKSet(new URL(`${teamDomain}/cdn-cgi/access/certs`));
  return jwks;
};

const parseStringArray = (claim: unknown): string[] => {
  if (!Array.isArray(claim)) {
    return [];
  }
  return claim.filter((group): group is string => typeof group === "string");
};

// The Access JWT carries no groups by default. They appear — under the
// `custom` claim — only when `groups` is explicitly configured as a custom
// SAML attribute / OIDC claim on the IdP integration, and even then on a
// best-effort basis: Cloudflare trims custom claims that push the token
// past ~1 KB, and groups are usually dropped first. Used only as a fallback
// when the get-identity lookup fails.
// https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/application-token/
const parseTokenGroups = (payload: Record<string, unknown>): string[] => {
  const custom = payload.custom;

  if (typeof custom === "object" && custom !== null && "groups" in custom) {
    return parseStringArray((custom as Record<string, unknown>).groups);
  }

  return parseStringArray(payload.groups);
};

const GET_IDENTITY_TIMEOUT_MS = 5_000;

/**
 * Fetches the user's full identity from Cloudflare's get-identity endpoint.
 * Unlike the JWT, it always carries the complete IdP group membership (the
 * token only has groups when explicitly configured as a custom claim, and
 * trims them past ~1 KB). The verified Access JWT doubles as the
 * CF_Authorization session cookie the endpoint expects. Returns null on any
 * failure so the caller can fall back to token groups.
 */
const fetchIdentityGroups = async (
  teamDomain: string,
  token: string,
): Promise<string[] | null> => {
  try {
    const response = await fetch(`${teamDomain}/cdn-cgi/access/get-identity`, {
      headers: { cookie: `CF_Authorization=${token}` },
      signal: AbortSignal.timeout(GET_IDENTITY_TIMEOUT_MS),
    });

    if (!response.ok) {
      logger.warn("Cloudflare get-identity request failed", {
        status: response.status,
      });
      return null;
    }

    const identity = (await response.json()) as Record<string, unknown>;

    // Okta-backed identities expose groups at idp.groups; other setups use
    // the top-level groups field. Merge both, deduplicated.
    const idp = identity.idp;
    const idpGroups =
      typeof idp === "object" && idp !== null
        ? (idp as Record<string, unknown>).groups
        : undefined;

    return [
      ...new Set([
        ...parseStringArray(identity.groups),
        ...parseStringArray(idpGroups),
      ]),
    ];
  } catch (error) {
    logger.warn("Cloudflare get-identity request errored", { error });
    return null;
  }
};

export const cloudflareAccessAdminAuthProvider: AdminAuthProvider = {
  name: "cloudflare-access",

  // Never trust identity headers (e.g. cf-access-authenticated-user-email)
  // on their own — only a verified JWT proves the request went through the
  // Cloudflare Access gate rather than hitting the origin host directly.
  authenticate: async (
    requestHeaders: Headers,
  ): Promise<AdminIdentity | null> => {
    const teamDomain = process.env.CF_ACCESS_TEAM_DOMAIN;
    const audience = process.env.CF_ACCESS_AUD;
    const token = requestHeaders.get(ASSERTION_HEADER);

    if (!teamDomain || !audience) {
      logger.error(
        "cloudflare-access admin auth provider is selected but CF_ACCESS_TEAM_DOMAIN or CF_ACCESS_AUD is not configured",
      );
      return null;
    }

    if (!token) {
      return null;
    }

    try {
      const { payload } = await jwtVerify(token, getJwks(teamDomain), {
        issuer: teamDomain,
        audience,
      });

      if (
        typeof payload.email !== "string" ||
        typeof payload.sub !== "string"
      ) {
        return null;
      }

      const groups =
        (await fetchIdentityGroups(teamDomain, token)) ??
        parseTokenGroups(payload);

      return {
        email: payload.email,
        subject: payload.sub,
        groups,
      };
    } catch {
      return null;
    }
  },
};
