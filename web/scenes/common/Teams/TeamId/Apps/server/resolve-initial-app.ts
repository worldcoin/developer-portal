import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import {
  PORTAL_CONTEXT_COOKIE,
  parsePortalContext,
  selectPreferredAppId,
} from "@/lib/portal-context";
import { cookies } from "next/headers";
import { getSdk } from "./graphql/resolve-initial-app.generated";

export const resolveInitialAppId = async ({
  teamId,
  userId,
}: {
  teamId: string;
  userId: string;
}): Promise<string | undefined> => {
  const context = parsePortalContext(
    (await cookies()).get(PORTAL_CONTEXT_COOKIE)?.value,
  );
  const preferredAppId =
    selectPreferredAppId({ context, userId, teamId }) ?? "";
  const { preferredApp, fallbackApp } = await getSdk(
    await getAPIServiceGraphqlClient(),
  ).ResolveInitialApp({
    teamId,
    userId,
    preferredAppId,
  });

  return preferredApp[0]?.id ?? fallbackApp[0]?.id;
};
