import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import { DecoratedButton } from "@/components/DecoratedButton";
import { LayersIconFrame } from "@/components/LayersIconFrame";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { urls } from "@/lib/urls";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Logo } from "./Logo";
import { getSdk as getFetchInvitesSdk } from "./graphql/server/fetch-invites.generated";

type Params = "invite_id";

export const JoinPage = async (props: {
  searchParams: Record<Params, string> | null | undefined;
}) => {
  const invite_id = props.searchParams?.invite_id;

  if (!invite_id) {
    return redirect("/404");
  }

  const client = await getAPIServiceGraphqlClient();

  const { invite_by_pk } = await getFetchInvitesSdk(client).FetchInvites({
    invite_id,
  });

  return (
    <div className="flex min-h-[100dvh] w-full items-center justify-center">
      <div className="grid max-w-[360px] gap-y-6">
        <LayersIconFrame>
          <Logo src={null} />
        </LayersIconFrame>

        <div className="grid gap-y-3">
          <Typography variant={TYPOGRAPHY.H6} className="text-center">
            Join {invite_by_pk?.team.name}
          </Typography>

          <Typography
            variant={TYPOGRAPHY.R3}
            className="text-center text-grey-500"
          >
            To join this team you need to create an account on World&apos;s
            Developer Portal
          </Typography>
        </div>

        <DecoratedButton
          href={urls.api.authLogin({ invite_id })}
          className="mt-2 py-3"
        >
          <Typography variant={TYPOGRAPHY.M3}>Join team</Typography>
        </DecoratedButton>

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
