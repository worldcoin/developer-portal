import {
  fetchSandboxAccessRequestIos,
  type SandboxAccessRequestIosState,
} from "@/api/v2/sandbox-access-request-ios/server/fetch-sandbox-access-request-ios";
import {
  fetchSandboxAccessRequest,
  type SandboxAccessRequestState,
} from "@/api/v2/sandbox-access-request/server/fetch-sandbox-access-request";
import { Role_Enum } from "@/graphql/graphql";
import { auth0 } from "@/lib/auth0";
import { isWorldUser } from "@/lib/is-world-user";
import { logger } from "@/lib/logger";
import { Auth0SessionUser } from "@/lib/types";
import { ReactNode } from "react";
import { PortalShell } from "./Shell";

/** Portal shell layout, mounted once at app/(portal)/layout.tsx. */
export const PortalLayout = async (props: { children: ReactNode }) => {
  const session = await auth0.getSession();
  const user = session?.user as Auth0SessionUser["user"];
  const memberships = user?.hasura?.memberships ?? [];
  const teams = memberships
    .map((m) => m.team)
    .filter((t): t is NonNullable<typeof t> => !!t?.id)
    .map((t) => ({ id: t.id, name: t.name ?? "Untitled team" }));
  const apiKeyTeamIds = memberships
    .filter(
      (membership) =>
        membership.role === Role_Enum.Owner ||
        membership.role === Role_Enum.Admin,
    )
    .map((membership) => membership.team?.id)
    .filter((teamId): teamId is string => Boolean(teamId));

  const userId = user?.hasura?.id;

  let sandboxRequestAndroid: SandboxAccessRequestState | null = null;
  let sandboxRequestIos: SandboxAccessRequestIosState | null = null;
  if (userId) {
    const [androidResult, iosResult] = await Promise.allSettled([
      fetchSandboxAccessRequest(userId),
      fetchSandboxAccessRequestIos(userId),
    ]);

    if (androidResult.status === "fulfilled") {
      sandboxRequestAndroid = androidResult.value;
    } else {
      logger.warn(
        "Failed to hydrate Android sandbox request in portal layout",
        {
          userId,
          error: androidResult.reason,
        },
      );
    }

    if (iosResult.status === "fulfilled") {
      sandboxRequestIos = iosResult.value;
    } else {
      logger.warn("Failed to hydrate iOS sandbox request in portal layout", {
        userId,
        error: iosResult.reason,
      });
    }
  }

  return (
    <PortalShell
      user={{
        name: user && isWorldUser(user) ? "Anonymous user" : user?.name,
        email: user?.email,
      }}
      teams={teams}
      apiKeyTeamIds={apiKeyTeamIds}
      sandboxRequestAndroid={sandboxRequestAndroid}
      sandboxRequestIos={sandboxRequestIos}
    >
      {props.children}
    </PortalShell>
  );
};
