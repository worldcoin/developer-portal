import { auth0 } from "@/lib/auth0";
import { calculateColorFromString } from "@/lib/calculate-color-from-string";
import { featureFlags } from "@/lib/feature-flags";
import { Auth0SessionUser } from "@/lib/types";
import { ReactNode } from "react";
import { Header } from "./Header";

export const PortalLayout = async (props: { children: ReactNode }) => {
  const session = await auth0.getSession();
  const user = session?.user as Auth0SessionUser["user"];
  const initialColor = calculateColorFromString(
    user?.name ?? user?.email ?? user?.sid,
  );

  // Flags evaluate server-side only; the header receives decisions, never lists.
  const memberTeamIds = (user?.hasura?.memberships ?? [])
    .map((m) => m.team?.id)
    .filter((id): id is string => !!id);
  const sandboxTeamIds = await featureFlags.worldIdSandbox.getSandboxTeamIds(
    memberTeamIds,
    user?.email,
  );

  return (
    <div className="grid min-h-dvh grid-rows-[auto_1fr]">
      <Header color={initialColor} sandboxTeamIds={sandboxTeamIds} />
      {props.children}
    </div>
  );
};
