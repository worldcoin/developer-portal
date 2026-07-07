import { pickPortalVersion } from "@/lib/feature-flags/portal-v3/activation";
import { generateMetaTitle } from "@/lib/genarate-title";
import { TeamsPage } from "@/scenes/Portal/Profile/Teams/page";
import { TeamsPage as TeamsPageV3 } from "@/scenes/PortalV3/Profile/Teams/page";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: generateMetaTitle({ left: "Teams" }),
};

export default async function Page() {
  return pickPortalVersion(
    () => <TeamsPageV3 />,
    () => <TeamsPage />,
  );
}
