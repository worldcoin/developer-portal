import { logger } from "@/lib/logger";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import "server-only";
import { cloudflareAccessAdminAuthProvider } from "./providers/cloudflare-access";
import { devAdminAuthProvider } from "./providers/dev";
import { AdminAuthProvider, AdminRole, AdminUser } from "./types";

export { AdminRole } from "./types";
export type { AdminAuthProvider, AdminIdentity, AdminUser } from "./types";

const providers: readonly AdminAuthProvider[] = [
  cloudflareAccessAdminAuthProvider,
  devAdminAuthProvider,
];

/**
 * Selects the auth provider named by ADMIN_AUTH_PROVIDER. Unset or unknown
 * values yield null, which means admin access is denied (fail closed).
 */
export const resolveAdminAuthProvider = (): AdminAuthProvider | null => {
  const providerName = process.env.ADMIN_AUTH_PROVIDER;

  if (!providerName) {
    return null;
  }

  const provider = providers.find(({ name }) => name === providerName);

  if (!provider) {
    logger.error("Unknown admin auth provider configured", { providerName });
    return null;
  }

  return provider;
};

const roleValues = new Set<string>(Object.values(AdminRole));

const isAdminRole = (value: string): value is AdminRole =>
  roleValues.has(value);

// Most privileged first, so a user matching several groups gets the widest
// role they are entitled to.
const rolePrecedence: readonly AdminRole[] = [
  AdminRole.Admin,
  AdminRole.Operator,
  AdminRole.Readonly,
];

const parseGroupRoleMapping = (): Record<string, AdminRole> => {
  const rawMapping = process.env.ADMIN_AUTH_GROUP_ROLES;

  if (!rawMapping) {
    return {};
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawMapping);
  } catch {
    logger.error("ADMIN_AUTH_GROUP_ROLES is not valid JSON");
    return {};
  }

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    logger.error("ADMIN_AUTH_GROUP_ROLES must be a JSON object");
    return {};
  }

  const mapping: Record<string, AdminRole> = {};
  for (const [group, role] of Object.entries(parsed)) {
    if (typeof role === "string" && isAdminRole(role)) {
      mapping[group] = role;
    } else {
      logger.error("ADMIN_AUTH_GROUP_ROLES contains an invalid role", {
        group,
        role,
      });
    }
  }
  return mapping;
};

/**
 * Maps provider-reported groups to a dashboard role via the
 * ADMIN_AUTH_GROUP_ROLES JSON mapping (e.g. {"example-readers":"readonly"}). When
 * several groups match, the most privileged role wins. When none match,
 * falls back to ADMIN_AUTH_DEFAULT_ROLE; without that, access is denied.
 */
export const resolveAdminRole = (groups: string[]): AdminRole | null => {
  const mapping = parseGroupRoleMapping();
  const matchedRoles = new Set(
    groups
      .map((group) => mapping[group])
      .filter((role): role is AdminRole => Boolean(role)),
  );

  for (const role of rolePrecedence) {
    if (matchedRoles.has(role)) {
      return role;
    }
  }

  const defaultRole = process.env.ADMIN_AUTH_DEFAULT_ROLE;
  if (defaultRole && isAdminRole(defaultRole)) {
    return defaultRole;
  }

  return null;
};

/**
 * Authenticates an admin request: provider -> identity -> role. Returns null
 * (deny) when no provider is configured, the request is unauthenticated, or
 * no role can be resolved for the identity.
 */
export const authenticateAdminRequest = async (
  requestHeaders: Headers,
): Promise<AdminUser | null> => {
  const provider = resolveAdminAuthProvider();

  if (!provider) {
    return null;
  }

  const identity = await provider.authenticate(requestHeaders);

  if (!identity) {
    return null;
  }

  const role = resolveAdminRole(identity.groups);

  if (!role) {
    logger.warn("Admin identity authenticated but no role resolved", {
      provider: provider.name,
      subject: identity.subject,
    });
    return null;
  }

  return { ...identity, role };
};

/**
 * Convenience wrapper for server components that reads the incoming request
 * headers via next/headers. Wrapped in cache() so several components in the
 * same request (page + nested components) authenticate once.
 */
export const getAdminUser = cache(async (): Promise<AdminUser | null> => {
  return authenticateAdminRequest(await headers());
});

/**
 * Per-page auth gate. Layouts are not a reliable auth barrier in Next.js
 * (they can render in parallel with — or be skipped for — the page on soft
 * navigation), so every server component page under /admin must call this
 * before touching any data. Unauthenticated requests are redirected to the
 * app's existing unauthorized page.
 */
export const requireAdminUser = async (): Promise<AdminUser> => {
  const user = await getAdminUser();

  if (!user) {
    redirect("/unauthorized");
  }

  return user;
};
