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
  const { action, app } = await fetchAppEnvCached(params.appId);
  const hasLegacyActions = (action?.length ?? 0) > 0;
  const hasRpRegistration = (app?.[0]?.rp_registration?.length ?? 0) > 0;
  const showLegacyList =
    searchParams.legacy === "true" && hasLegacyActions;

  if (showLegacyList) {
    return (
      <ActionsPage
        params={Promise.resolve(params)}
        searchParams={Promise.resolve(searchParams)}
      />
    );
  }

  if (hasLegacyActions && !hasRpRegistration) {
    const query = new URLSearchParams({ legacy: "true" });
    if (searchParams.createAction === "true") {
      query.set("createAction", "true");
    }
    redirect(
      `${urls.actions({ team_id: params.teamId, app_id: params.appId })}?${query}`,
    );
  }

  if (!hasRpRegistration) {
    redirect(
      urls.enableWorldId4({ team_id: params.teamId, app_id: params.appId }),
    );
  }

  const worldIdActionsUrl = urls.worldIdActions({
    team_id: params.teamId,
    app_id: params.appId,
  });

  redirect(
    searchParams.createAction === "true"
      ? `${worldIdActionsUrl}?createAction=true`
      : worldIdActionsUrl,
  );
}
