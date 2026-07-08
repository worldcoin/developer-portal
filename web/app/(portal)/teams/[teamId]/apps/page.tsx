import { pickPortalVersion } from "@/lib/feature-flags/portal-v3/activation";
import { generateMetaTitle } from "@/lib/genarate-title";
import { AppsPage } from "@/scenes/Portal/Teams/TeamId/Apps/page";
import { AppsPage as AppsPageV3 } from "@/scenes/PortalV3/Teams/TeamId/Apps/page";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: generateMetaTitle({ left: "Apps" }),
};

type Props = { params: Promise<Record<string, string>> };

export default async function Page(props: Props) {
  return pickPortalVersion(
    () => <AppsPageV3 params={props.params} />,
    () => <AppsPage params={props.params} />,
  );
}
