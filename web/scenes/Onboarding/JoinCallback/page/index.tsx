import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import { DecoratedButton } from "@/components/DecoratedButton";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { auth0 } from "@/lib/auth0";
import { logger } from "@/lib/logger";
import { Auth0SessionUser } from "@/lib/types";
import { urls } from "@/lib/urls";
import { redirect } from "next/navigation";
import { InviteCard } from "./InviteCard";
import { JoinCallbackPageContent } from "./JoinCallbackPageContent";
import { getSdk as getFetchJoinInviteSdk } from "./graphql/server/fetch-join-invite.generated";

/**
 * Consent screen for a team invite.
 *
 * Nothing is consumed by rendering this page. The invite is only claimed by the
 * POST the user triggers from here, which is what keeps a cross-site navigation
 * from silently force-joining a signed-in developer to somebody else's team
 * (HackerOne #3943242) — so this screen must always name the team being joined
 * and must never auto-submit.
 */
export const JoinCallback = async (props: {
  searchParams: Promise<{ invite_id?: string }>;
}) => {
  const searchParams = await props.searchParams;
  const invite_id = searchParams?.invite_id;

  const session = await auth0.getSession();

  // A user who already has a team belongs on the dashboard; one arriving here
  // mid-signup still has to create or join one. Either way, bailing out of an
  // invite must not end the session — a bad invite_id used to log the visitor
  // out, which any cross-site link could trigger.
  const hasTeam = Boolean(
    (session?.user as Auth0SessionUser["user"])?.hasura?.memberships?.length,
  );
  const exitUrl = hasTeam ? urls.dashboard() : urls.createTeam();

  if (!invite_id) {
    logger.warn("No invite_id found in searchParams after join");

    return redirect(exitUrl);
  }

  const client = await getAPIServiceGraphqlClient();

  const { invite_by_pk: invite } = await getFetchJoinInviteSdk(
    client,
  ).FetchJoinInvite({ invite_id });

  if (!invite || new Date(invite.expires_at) <= new Date()) {
    return (
      <InviteCard
        title="This invite is no longer valid"
        description="It has expired or has already been used. Ask a team owner to send you a new one."
      >
        <DecoratedButton
          href={exitUrl}
          variant="secondary"
          className="mt-2 py-3"
        >
          <Typography variant={TYPOGRAPHY.M3}>Continue</Typography>
        </DecoratedButton>
      </InviteCard>
    );
  }

  return (
    <JoinCallbackPageContent
      invite_id={invite_id}
      teamName={invite.team.name ?? "this team"}
      exitUrl={exitUrl}
    />
  );
};
