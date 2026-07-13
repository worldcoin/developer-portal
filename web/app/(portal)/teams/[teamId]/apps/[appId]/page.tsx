import { pickPortalVersion } from "@/lib/feature-flags/portal-v3/activation";
import { generateMetaTitle } from "@/lib/genarate-title";
import { appendSearchParams, urls } from "@/lib/urls";
import { AppIdPage } from "@/scenes/Portal/Teams/TeamId/Apps/AppId/page";
import { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: generateMetaTitle({ left: "Dashboard" }),
};

type Props = {
  params: Promise<{ teamId: string; appId: string }>;
  searchParams: Promise<Record<string, string>>;
};

export default async function Page(props: Props) {
  const params = await props.params;
  const searchParams = await props.searchParams;

  // v3 folds the app dashboard into the World ID landing. Preserve any query
  // string so deep links (?enableWorldId4=true, ?createAction=true) survive the
  // redirect.
  const target = appendSearchParams(
    urls.worldId({ team_id: params.teamId, app_id: params.appId }),
    searchParams,
  );

  return pickPortalVersion(
    () => redirect(target),
    () => <AppIdPage params={props.params} />,
  );
}
