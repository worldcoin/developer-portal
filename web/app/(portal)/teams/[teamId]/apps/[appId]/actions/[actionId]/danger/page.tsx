import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import { generateMetaTitle } from "@/lib/genarate-title";
import { ActionIdDangerPage } from "@/scenes/Portal/Teams/TeamId/Apps/AppId/Actions/ActionId/Danger/page";
import { getSdk } from "@/scenes/Portal/Teams/TeamId/Apps/AppId/layout/graphql/server/fetch-app-env.generated";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: generateMetaTitle({ left: "Danger zone" }),
};

export default async function Page({
  params,
  searchParams,
}: {
  params: { teamId: string; appId: string; actionId: string };
  searchParams: Record<string, string> | null | undefined;
}) {
  const client = await getAPIServiceGraphqlClient();
  const { app } = await getSdk(client).FetchAppEnv({ id: params.appId });
  const hasRpRegistration = (app[0]?.rp_registration?.length ?? 0) > 0;

  return (
    <ActionIdDangerPage
      params={params}
      searchParams={searchParams}
      isReadOnly={hasRpRegistration}
    />
  );
}
