import { generateMetaTitle } from "@/lib/genarate-title";
import { urls } from "@/lib/urls";
import { fetchAppEnvCached } from "@/scenes/Portal/Teams/TeamId/Apps/AppId/layout/server/fetch-app-env";
import { ActionsPage } from "@/scenes/Portal/Teams/TeamId/Apps/AppId/Actions/page";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { AppLayoutRouteParams } from "../layout-params";

export const metadata: Metadata = {
  title: generateMetaTitle({ left: "Incognito actions" }),
};

type Props = {
  params: AppLayoutRouteParams;
  searchParams: Promise<Record<string, string>>;
};

export default async function Page(props: Props) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const { action } = await fetchAppEnvCached(params.appId);
  const hasLegacyActions = (action?.length ?? 0) > 0;
  const showLegacyList = searchParams.legacy === "true" && hasLegacyActions;

  if (!showLegacyList) {
    const destination = urls.worldIdActions({
      team_id: params.teamId,
      app_id: params.appId,
    });

    redirect(
      searchParams.createAction === "true"
        ? `${destination}?createAction=true`
        : destination,
    );
  }

  return (
    <ActionsPage
      params={Promise.resolve(params)}
      searchParams={Promise.resolve(searchParams)}
    />
  );
}
