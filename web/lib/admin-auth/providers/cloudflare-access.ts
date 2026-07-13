import { logger } from "@/lib/logger";
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose";
import "server-only";
import {
  AdminAuthProvider,
  AdminAuthResult,
  DashboardAccessLevel,
  isDashboardAccessLevel,
} from "../types";

// All Cloudflare Access / Okta specifics live in this file only. The rest of
// the app depends on the generic AdminAuthProvider interface, so a fork can
// drop this provider and plug in a different one via ADMIN_AUTH_PROVIDER.

const ASSERTION_HEADER = "cf-access-jwt-assertion";

const jwksByTeamDomain = new Map<
  string,
  ReturnType<typeof createRemoteJWKSet>
>();

const getJwks = (teamDomain: string) => {
  let jwks = jwksByTeamDomain.get(teamDomain);

  if (!jwks) {
    jwks = createRemoteJWKSet(new URL(`${teamDomain}/cdn-cgi/access/certs`));
    jwksByTeamDomain.set(teamDomain, jwks);
  }

  return jwks;
};

const describeJwtVerifyError = (error: unknown) => {
  if (!(error instanceof Error)) {
    return { name: "UnknownError" };
  }

  return {
    name: error.name,
    message: error.message,
    code:
      "code" in error && typeof error.code === "string"
        ? error.code
        : undefined,
  };
};

const parseGroupIdentifiers = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((group) => {
    if (typeof group === "string") {
      return [group];
    }

    if (typeof group !== "object" || group === null) {
      return [];
    }

    const id = (group as Record<string, unknown>).id;
    const name = (group as Record<string, unknown>).name;

    return [
      typeof id === "string" ? id : null,
      typeof name === "string" ? name : null,
    ].filter((accessGroup): accessGroup is string => Boolean(accessGroup));
  });
};

type GroupsByAccessLevel = Partial<Record<DashboardAccessLevel, string[]>>;

const parseGroupsByAccessLevel = (): GroupsByAccessLevel | null => {
  const rawMapping = process.env.CF_ACCESS_GROUPS_BY_ACCESS_LEVEL;

  if (!rawMapping) {
    return null;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawMapping);
  } catch {
    logger.error("CF_ACCESS_GROUPS_BY_ACCESS_LEVEL is not valid JSON");
    return null;
  }

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    logger.error("CF_ACCESS_GROUPS_BY_ACCESS_LEVEL must be a JSON object");
    return null;
  }

  const groupsByAccessLevel: GroupsByAccessLevel = {};

  for (const [accessLevel, groups] of Object.entries(parsed)) {
    if (!isDashboardAccessLevel(accessLevel)) {
      logger.error(
        "CF_ACCESS_GROUPS_BY_ACCESS_LEVEL contains an invalid access level",
        { accessLevel },
      );
      return null;
    }

    if (
      !Array.isArray(groups) ||
      groups.some((group) => typeof group !== "string")
    ) {
      logger.error(
        "CF_ACCESS_GROUPS_BY_ACCESS_LEVEL access level must map to a string array",
        { accessLevel },
      );
      return null;
    }

    groupsByAccessLevel[accessLevel] = groups;
  }

  return groupsByAccessLevel;
};

const resolveCloudflareAccessLevel = (
  providerGroups: string[],
): DashboardAccessLevel | null => {
  const groupsByAccessLevel = parseGroupsByAccessLevel();

  if (!groupsByAccessLevel) {
    return null;
  }

  const groups = new Set(providerGroups);
  const readGroups = groupsByAccessLevel[DashboardAccessLevel.Read] ?? [];

  return readGroups.some((group) => groups.has(group))
    ? DashboardAccessLevel.Read
    : null;
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
    return parseGroupIdentifiers((custom as Record<string, unknown>).groups);
  }

  return parseGroupIdentifiers(payload.groups);
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
        ...parseGroupIdentifiers(identity.groups),
        ...parseGroupIdentifiers(idpGroups),
      ]),
    ];
  } catch (error) {
    logger.warn("Cloudflare get-identity request errored", { error });
    return null;
  }
};

type CloudflareAccessConfig = {
  audience: string;
  teamDomain: string;
};

type VerifiedCloudflareAccessToken = {
  payload: JWTPayload;
  teamDomain: string;
  token: string;
};

const getCloudflareAccessConfig = (
  logConfigurationError: boolean,
): CloudflareAccessConfig | null => {
  const teamDomain = process.env.CF_ACCESS_TEAM_DOMAIN;
  const audience = process.env.CF_ACCESS_AUD;

  if (!teamDomain || !audience) {
    if (logConfigurationError) {
      logger.error(
        "cloudflare-access admin auth provider is selected but CF_ACCESS_TEAM_DOMAIN or CF_ACCESS_AUD is not configured",
      );
    }
    return null;
  }

  return { audience, teamDomain };
};

const verifyCloudflareAccessToken = async (
  requestHeaders: Headers,
  logValidationError: boolean,
): Promise<VerifiedCloudflareAccessToken | null> => {
  const config = getCloudflareAccessConfig(logValidationError);
  const token = requestHeaders.get(ASSERTION_HEADER);

  if (!config || !token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, getJwks(config.teamDomain), {
      issuer: config.teamDomain,
      audience: config.audience,
      algorithms: ["RS256"],
    });

    return { payload, teamDomain: config.teamDomain, token };
  } catch (error) {
    if (logValidationError) {
      logger.warn(
        "Cloudflare Access JWT verification failed",
        describeJwtVerifyError(error),
      );
    }
    return null;
  }
};

export const cloudflareAccessAdminAuthProvider: AdminAuthProvider = {
  name: "cloudflare-access",

  // The proxy validates the assertion's signature, issuer, audience, and
  // algorithm, but only authenticate() resolves groups and authorizes access.
  hasAuthenticationEvidence: async (
    requestHeaders: Headers,
  ): Promise<boolean> => {
    return Boolean(await verifyCloudflareAccessToken(requestHeaders, false));
  },

  // Never trust identity headers (e.g. cf-access-authenticated-user-email)
  // on their own — only a verified JWT proves the request went through the
  // Cloudflare Access gate rather than hitting the origin host directly.
  authenticate: async (
    requestHeaders: Headers,
  ): Promise<AdminAuthResult | null> => {
    const verifiedToken = await verifyCloudflareAccessToken(
      requestHeaders,
      true,
    );

    if (
      !verifiedToken ||
      typeof verifiedToken.payload.email !== "string" ||
      typeof verifiedToken.payload.sub !== "string"
    ) {
      return null;
    }

    const groups =
      (await fetchIdentityGroups(
        verifiedToken.teamDomain,
        verifiedToken.token,
      )) ?? parseTokenGroups(verifiedToken.payload);
    const accessLevel = resolveCloudflareAccessLevel(groups);

    return {
      email: verifiedToken.payload.email,
      subject: verifiedToken.payload.sub,
      accessLevel,
    };
  },
};
