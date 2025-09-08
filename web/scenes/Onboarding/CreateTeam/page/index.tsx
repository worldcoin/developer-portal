import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import { WorldBlueprintIcon } from "@/components/Icons/WorldBlueprintIcon";
import { LayersIconFrame } from "@/components/LayersIconFrame";
import { SizingWrapper } from "@/components/SizingWrapper";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { Auth0SessionUser } from "@/lib/types";
import { urls } from "@/lib/urls";
import { getSession } from "@auth0/nextjs-auth0";

import { redirect } from "next/navigation";
import { Form } from "./Form";
import {
  FetchUserQuery,
  getSdk as getFetchMembershipsSdk,
} from "./graphql/server/fetch-user.generated";

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

  let data: FetchUserQuery | null = null;

  if (user.hasura?.id) {
    data = await getFetchMembershipsSdk(client).FetchUser({
      userId: user.hasura.id,
    });
  }

  const hasUser = Boolean(data) && Boolean(data!.user_by_pk?.id);

  return (
    <SizingWrapper fullHeight>
      <div className="flex h-full items-center justify-center">
        <div className="grid w-full max-w-[580px] gap-y-8">
          <LayersIconFrame>
            <WorldBlueprintIcon />
          </LayersIconFrame>

          <Typography as="h1" variant={TYPOGRAPHY.H6} className="text-center">
            {hasUser ? "Create a new team" : "Create your first team"}
          </Typography>

          <Form hasUser={hasUser} />
        </div>
      </div>
    </SizingWrapper>
  );
};
