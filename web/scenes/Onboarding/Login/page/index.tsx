import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import { DecoratedButton } from "@/components/DecoratedButton";
import { WorldBlueprintIcon } from "@/components/Icons/WorldBlueprintIcon";
import { LayersIconFrame } from "@/components/LayersIconFrame";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { logger } from "@/lib/logger";
import { Auth0SessionUser } from "@/lib/types";
import { urls } from "@/lib/urls";
import { getSession } from "@auth0/nextjs-auth0";
import { redirect } from "next/navigation";
import {
  FetchMembershipsQuery,
  getSdk as getFetchMembershipsSdk,
} from "./graphql/server/fetch-memberships.generated";

export const LoginPage = async () => {
  let session = await getSession();
  const user = session?.user as Auth0SessionUser["user"];

  if (user) {
    const client = await getAPIServiceGraphqlClient();

    let membership: FetchMembershipsQuery["membership"] | null = null;

    try {
      const data = await getFetchMembershipsSdk(client).FetchMemberships({
        userId: user?.hasura.id,
      });

      membership = data.membership;
    } catch (error) {
      logger.error(
        "Error fetching memberships on login page with active session",
        { error },
      );

      return redirect(urls.logout());
    }

    if (membership?.length > 0) {
      return redirect(urls.apps({ team_id: membership[0].team_id }));
    }

    if (membership?.length === 0) {
      return redirect(urls.createTeam());
    }
  }

  return (
    <div className="flex size-full items-center justify-center">
      <div className="grid max-w-[360px] gap-y-10">
        <LayersIconFrame>
          <WorldBlueprintIcon />
        </LayersIconFrame>

        <div className="grid gap-y-3">
          <Typography as="h1" variant={TYPOGRAPHY.H6} className="text-center">
            World ID is now generally available
          </Typography>

          <Typography
            as="p"
            variant={TYPOGRAPHY.R3}
            className="text-center text-grey-500"
          >
            The World protocol is enabling a new class of applications built on
            top of anonymous proof of human
          </Typography>
        </div>

        <div className="grid gap-y-4">
          <DecoratedButton href={urls.api.authLogin()} className="py-4">
            Create an account
          </DecoratedButton>

          <DecoratedButton
            variant="secondary"
            className="py-4"
            href="https://docs.world.org"
          >
            Explore Docs
          </DecoratedButton>
        </div>
      </div>
    </div>
  );
};
