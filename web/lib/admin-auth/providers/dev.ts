import "server-only";
import { AdminAuthProvider, AdminIdentity } from "../types";

const DEBUG_USER_HEADER = "x-admin-auth-debug-user";

const parseDevGroups = (): string[] => {
  const raw = process.env.ADMIN_AUTH_DEV_GROUPS;

  if (!raw) {
    return [];
  }

  return raw
    .split(",")
    .map((group) => group.trim())
    .filter(Boolean);
};

/**
 * Local development provider. Authenticates as the email supplied via the
 * x-admin-auth-debug-user header or the ADMIN_AUTH_DEV_EMAIL env var.
 * Group membership comes from ADMIN_AUTH_DEV_GROUPS. Hard-disabled in
 * production regardless of configuration.
 */
export const devAdminAuthProvider: AdminAuthProvider = {
  name: "dev",

  authenticate: async (
    requestHeaders: Headers,
  ): Promise<AdminIdentity | null> => {
    if (process.env.NODE_ENV === "production") {
      return null;
    }

    const email =
      requestHeaders.get(DEBUG_USER_HEADER) ?? process.env.ADMIN_AUTH_DEV_EMAIL;

    if (!email) {
      return null;
    }

    return {
      email,
      subject: `dev:${email}`,
      groups: parseDevGroups(),
    };
  },
};
