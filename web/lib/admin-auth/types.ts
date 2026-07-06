export enum AdminRole {
  Readonly = "readonly",
  Operator = "operator",
  Admin = "admin",
}

/**
 * Identity established by an auth provider. Providers only authenticate;
 * they know nothing about dashboard roles or authorization.
 */
export type AdminIdentity = {
  email: string;
  /**
   * Stable, provider-scoped identifier for the authenticated principal
   * (e.g. a JWT `sub` claim).
   */
  subject: string;
  /**
   * Group memberships reported by the identity provider, used by the core
   * layer to resolve the dashboard role. Empty when the provider has no
   * group concept.
   */
  groups: string[];
};

/** Authenticated admin user with the resolved dashboard role. */
export type AdminUser = AdminIdentity & {
  role: AdminRole;
};

/**
 * Pluggable authentication backend for the internal dashboard. Deployments
 * select an implementation via the ADMIN_AUTH_PROVIDER env var; forks can
 * add their own implementation without touching routes or the core layer.
 */
export type AdminAuthProvider = {
  name: string;
  /**
   * Returns the identity of the request's principal, or null when the
   * request is not authenticated. Must never throw for unauthenticated
   * requests.
   */
  authenticate: (requestHeaders: Headers) => Promise<AdminIdentity | null>;
};
