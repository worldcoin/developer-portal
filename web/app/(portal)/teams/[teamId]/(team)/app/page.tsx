import { pickPortalVersion } from "@/lib/feature-flags/portal-v3/activation";
import { generateMetaTitle } from "@/lib/genarate-title";
import { AppsPage } from "@/scenes/Portal/Teams/TeamId/Team/Apps/page";
import { AppsPage as AppsPageV3 } from "@/scenes/PortalV3/Teams/TeamId/Team/Apps/page";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: generateMetaTitle({ left: "Apps" }),
};

export default async function Page() {
  return pickPortalVersion(
    () => <AppsPageV3 />,
    () => <AppsPage />,
  );
}
