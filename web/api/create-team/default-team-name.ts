import type { Auth0User } from "@/lib/types";

export const getDefaultTeamName = (user: Auth0User) => {
  const source = user.email?.split("@")[0] || user.name || "My Team";
  const name = source.trim().slice(0, 128);

  return name || "My Team";
};
