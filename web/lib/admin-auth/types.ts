export enum AdminHasuraRole {
  Readonly = "internal_dashboard_readonly",
  Write = "internal_dashboard_write",
}

/**
 * Provider-neutral dashboard access levels.
 */
export enum DashboardAccessLevel {
  Read = "read",
  Write = "write",
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
  hasAuthenticationEvidence: (requestHeaders: Headers) => Promise<boolean>;
  /**
   * Returns an authenticated principal with its dashboard access level, or
   * null when the request is unauthenticated. A null access level means the
   * principal is authenticated but not authorized for the dashboard.
   */
  authenticate: (requestHeaders: Headers) => Promise<AdminAuthResult | null>;
};
