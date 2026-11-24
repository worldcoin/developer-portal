import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import { LayersIconFrame } from "@/components/LayersIconFrame";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { auth0 } from "@/lib/auth0";
import { urls } from "@/lib/urls";
import Link from "next/link";
import { redirect } from "next/navigation";
import { JoinTeamButton } from "./JoinTeamButton";
import { Logo } from "./Logo";
import { getSdk as getFetchInvitesSdk } from "./graphql/server/fetch-invites.generated";

type Params = "invite_id";

export const JoinPage = async (props: {
  searchParams: Promise<Record<Params, string>>;
}) => {
  const searchParams = await props.searchParams;
  const invite_id = searchParams?.invite_id;

  if (!invite_id) {
    return redirect("/404");
  }

  const client = await getAPIServiceGraphqlClient();

  const { invite_by_pk } = await getFetchInvitesSdk(client).FetchInvites({
    invite_id,
  });

  if (!invite_by_pk || new Date(invite_by_pk.expires_at) <= new Date()) {
    return redirect("/404");
  }

  const session = await auth0.getSession();
  const teamName = invite_by_pk.team.name;
  const hasSession = Boolean(session);

  return (
    <div className="flex min-h-dvh w-full items-center justify-center">
      <div className="grid max-w-[360px] gap-y-6">
        <LayersIconFrame>
          <Logo src={null} />
        </LayersIconFrame>

        <div className="grid gap-y-3">
          <Typography variant={TYPOGRAPHY.H6} className="text-center">
            Join {teamName}
          </Typography>

          <Typography
            variant={TYPOGRAPHY.R3}
            className="text-center text-grey-500"
          >
            {hasSession
              ? "Confirm you want to join this team on World's Developer Portal"
              : "To join this team you need to create an account on World's Developer Portal"}
          </Typography>
        </div>

        <JoinTeamButton
          invite_id={invite_id}
          hasSession={hasSession}
          loginHref={urls.api.authLogin({ invite_id })}
        />

        <p className="text-center font-gta text-xs leading-[1.3] text-grey-500">
          By signing up, you are creating a Developer Portal account and agree
          to World&apos;s{" "}
          <Link
            target="_blank"
            className="text-grey-900 underline"
            href={urls.tos()}
          >
            User terms
          </Link>{" "}
          and{" "}
          <Link
            target="_blank"
            className="text-grey-900 underline"
            href={urls.privacyStatement()}
          >
            Privacy notice
          </Link>
        </p>
      </div>
    </div>
  );
};
