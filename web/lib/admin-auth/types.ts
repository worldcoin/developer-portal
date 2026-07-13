export enum AdminHasuraRole {
  Readonly = "internal_dashboard_readonly",
}

/**
 * Provider-neutral dashboard access levels.
 *
 * Add `Write` and `Manage` only when matching Hasura roles and permissions are
 * implemented.
 *
 * @example
 * enum DashboardAccessLevel {
 *   Read = "read",
 *   Write = "write",
 *   Manage = "manage",
 * }
 */
export enum DashboardAccessLevel {
  Read = "read",
}

export const isDashboardAccessLevel = (
  accessLevel: string,
): accessLevel is DashboardAccessLevel =>
  Object.values(DashboardAccessLevel).some((level) => level === accessLevel);

export type AdminAuthProviderName = "cloudflare-access" | "dev";

export type AdminAuthResult = {
  email: string;
  subject: string;
  accessLevel: DashboardAccessLevel | null;
};

export type AdminUser = {
  email: string;
  subject: string;
  role: AdminHasuraRole;
};

/**
 * Pluggable authentication and authorization backend for the internal
 * dashboard. Providers translate their own authorization model into a
 * provider-neutral access level.
 */
export type AdminAuthProvider = {
  name: AdminAuthProviderName;
  /**
   * Returns an authenticated principal with its dashboard access level, or
   * null when the request is unauthenticated. A null access level means the
   * principal is authenticated but not authorized for the dashboard.
   */
  authenticate: (requestHeaders: Headers) => Promise<AdminAuthResult | null>;
};
