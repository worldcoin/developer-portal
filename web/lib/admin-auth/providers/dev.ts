import "server-only";
import {
  AdminAuthProvider,
  AdminAuthResult,
  isDashboardAccessLevel,
} from "../types";

const DEBUG_USER_HEADER = "x-admin-auth-debug-user";

/**
 * Local development provider. Authenticates as the email supplied via the
 * x-admin-auth-debug-user header or the ADMIN_AUTH_DEV_EMAIL env var.
 * ADMIN_AUTH_DEV_ACCESS_LEVEL determines dashboard access. Hard-disabled in
 * production regardless of configuration.
 */
export const devAdminAuthProvider: AdminAuthProvider = {
  name: "dev",

  authenticate: async (
    requestHeaders: Headers,
  ): Promise<AdminAuthResult | null> => {
    if (process.env.NODE_ENV === "production") {
      return null;
    }

    const email =
      requestHeaders.get(DEBUG_USER_HEADER) ?? process.env.ADMIN_AUTH_DEV_EMAIL;

    if (!email) {
      return null;
    }

    const configuredAccessLevel = process.env.ADMIN_AUTH_DEV_ACCESS_LEVEL;
    const accessLevel =
      configuredAccessLevel && isDashboardAccessLevel(configuredAccessLevel)
        ? configuredAccessLevel
        : null;

    return {
      email,
      subject: `dev:${email}`,
      accessLevel,
    };
  },
};
