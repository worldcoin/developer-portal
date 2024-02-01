import { Auth0EmailUser, Auth0User } from "@/lib/types";

export const isEmailUser = (user: Auth0User): user is Auth0EmailUser =>
  user.sub.startsWith("email|");
