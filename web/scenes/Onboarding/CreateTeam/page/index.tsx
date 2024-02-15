import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import { WorldcoinBlueprintIcon } from "@/components/Icons/WorldcoinBlueprintIcon";
import { LayersIconFrame } from "@/components/LayersIconFrame";
import { SizingWrapper } from "@/components/SizingWrapper";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { Auth0SessionUser } from "@/lib/types";
import { urls } from "@/lib/urls";
import { getSession } from "@auth0/nextjs-auth0";

import { redirect } from "next/navigation";
import { Form } from "./Form";
import {
  FetchMembershipsQuery,
  getSdk as getFetchMembershipsSdk,
} from "./graphql/server/fetch-membersips.generated";

type CreateTeamPage = {
  params: Record<string, string> | null | undefined;
};

export const CreateTeamPage = async (props: CreateTeamPage) => {
  const session = await getSession();
  const user = session?.user as Auth0SessionUser["user"];

  if (!user) {
    return redirect(urls.logout());
  }

  const client = await getAPIServiceGraphqlClient();

  let data: FetchMembershipsQuery | null = null;

  if (user.hasura?.id) {
    data = await getFetchMembershipsSdk(client).FetchMemberships({
      userId: user.hasura.id,
    });
  }

  const hasMemberships =
    Boolean(data) && data!.membership && data!.membership.length > 0;

  return (
    <SizingWrapper>
      <div className="flex h-full items-center justify-center">
        <div className="grid w-full max-w-[580px] gap-y-8">
          <LayersIconFrame>
            <WorldcoinBlueprintIcon />
          </LayersIconFrame>

          <Typography as="h1" variant={TYPOGRAPHY.H6} className="text-center">
            {hasMemberships ? "Create a new team" : "Create your first team"}
          </Typography>

          <Form hasMemberships={hasMemberships} />
        </div>
      </div>
    </SizingWrapper>
  );
};
