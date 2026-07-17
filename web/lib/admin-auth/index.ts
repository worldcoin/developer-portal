import { logger } from "@/lib/logger";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import "server-only";
import { cloudflareAccessAdminAuthProvider } from "./providers/cloudflare-access";
import { devAdminAuthProvider } from "./providers/dev";
import {
  AdminAuthProvider,
  AdminHasuraRole,
  AdminUser,
  DashboardAccessLevel,
} from "./types";

export { AdminHasuraRole, DashboardAccessLevel } from "./types";
export type {
  AdminAuthProvider,
  AdminAuthProviderName,
  AdminAuthResult,
  AdminUser,
} from "./types";

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

export const hasAdminAuthenticationEvidence = (
  requestHeaders: Headers,
): Promise<boolean> => {
  return (
    resolveAdminAuthProvider()?.hasAuthenticationEvidence(requestHeaders) ??
    Promise.resolve(false)
  );
};

const roleByAccessLevel = {
  [DashboardAccessLevel.Read]: AdminHasuraRole.Readonly,
} satisfies Record<DashboardAccessLevel, AdminHasuraRole>;

/**
 * Returns the dashboard user authorized by the selected provider. Returns null
 * when no provider is configured, authentication fails, or no access is granted.
 */
export const authenticateAdminRequest = async (
  requestHeaders: Headers,
): Promise<AdminUser | null> => {
  const provider = resolveAdminAuthProvider();

  if (!provider) {
    return null;
  }

  const result = await provider.authenticate(requestHeaders);

  if (!result?.accessLevel) {
    return null;
  }

  return {
    email: result.email,
    subject: result.subject,
    role: roleByAccessLevel[result.accessLevel],
  };
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
 * before touching any data. This convention is backed by a unit test that
 * scans admin page files for requireAdminUser. Unauthenticated requests are
 * redirected to the app's existing unauthorized page.
 */
export const requireAdminUser = async (): Promise<AdminUser> => {
  const user = await getAdminUser();

  if (!user) {
    redirect("/unauthorized");
  }

  return user;
};
