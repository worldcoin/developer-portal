import "server-only";

import { Auth0PasswordUser, Auth0User } from "@/lib/types";

export const isPasswordUser = (user: Auth0User): user is Auth0PasswordUser =>
  user.sub.startsWith("auth0|");
