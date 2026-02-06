import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import { generateMetaTitle } from "@/lib/genarate-title";
import { ActionsPage } from "@/scenes/Portal/Teams/TeamId/Apps/AppId/Actions/page";
import { getSdk } from "@/scenes/Portal/Teams/TeamId/Apps/AppId/layout/graphql/server/fetch-app-env.generated";
import { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: { teamId: string; appId: string };
}): Promise<Metadata> {
  const client = await getAPIServiceGraphqlClient();
  const { app } = await getSdk(client).FetchAppEnv({ id: params.appId });
  const hasRpRegistration = (app[0]?.rp_registration?.length ?? 0) > 0;

  return {
    title: generateMetaTitle({
      left: hasRpRegistration ? "World ID 3.0 Legacy" : "Incognito actions",
    }),
  };
}

export default async function Page({
  params,
  searchParams,
}: {
  params: { teamId: string; appId: string };
  searchParams: Record<string, string> | null | undefined;
}) {
  const client = await getAPIServiceGraphqlClient();
  const { app } = await getSdk(client).FetchAppEnv({ id: params.appId });
  const hasRpRegistration = (app[0]?.rp_registration?.length ?? 0) > 0;

  return (
    <ActionsPage
      params={params}
      searchParams={searchParams}
      isReadOnly={hasRpRegistration}
    />
  );
}
