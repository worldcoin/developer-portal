import { Auth0User, Auth0WorldUser } from "@/lib/types";

// Client-safe counterpart of api/helpers/is-email-user / is-password-user
// (those are server-only): identifies sessions authenticated through the
// legacy Sign in with World ID auth0 connection.
export const isWorldUser = (user: Auth0User): user is Auth0WorldUser =>
  user.sub.startsWith("oauth2|worldcoin|");
