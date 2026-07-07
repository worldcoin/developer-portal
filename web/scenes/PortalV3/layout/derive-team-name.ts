import { Auth0SessionUser } from "@/lib/types";

/**
 * Pure helper shared by server components (portal layout, v3 create-team
 * page) and tests. Lives outside AutoTeamBootstrap because that file is
 * "use client" — importing a function from it into a server component turns
 * it into an uninvokable client reference.
 */
export const deriveTeamName = (
  user: Auth0SessionUser["user"] | null | undefined,
): string => {
  // Email signups get `name === email` from auth0 — fall through to the
  // email local-part instead of naming the team "foo@bar.com's team".
  const name = user?.name;
  const fromName = name && !name.includes("@") ? name.split(" ")[0] : undefined;
  const fromEmail = user?.email?.split("@")[0];
  const first = fromName || fromEmail;
  return first ? `${first}'s team` : "My team";
};
