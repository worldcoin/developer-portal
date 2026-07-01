import { pickPortalVersion } from "@/lib/feature-flags/portal-v3/activation";
import { generateMetaTitle } from "@/lib/genarate-title";
import { ActionsPage } from "@/scenes/Portal/Teams/TeamId/Apps/AppId/Actions/page";
import { ActionsPage as ActionsPageV3 } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/Actions/page";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: generateMetaTitle({ left: "Incognito actions" }),
};

export default async function Page(props: {
  params: Promise<Record<string, string>>;
  searchParams: Promise<Record<string, string>>;
}) {
  return pickPortalVersion(
    () => (
      <ActionsPageV3 params={props.params} searchParams={props.searchParams} />
    ),
    () => (
      <ActionsPage params={props.params} searchParams={props.searchParams} />
    ),
  );
}
