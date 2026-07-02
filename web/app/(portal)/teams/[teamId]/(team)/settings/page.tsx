import { pickPortalVersion } from "@/lib/feature-flags/portal-v3/activation";
import { generateMetaTitle } from "@/lib/genarate-title";
import { TeamSettingsPage } from "@/scenes/Portal/Teams/TeamId/Team/Settings/page";
import { TeamSettingsPage as TeamSettingsPageV3 } from "@/scenes/PortalV3/Teams/TeamId/Team/Settings/page";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: generateMetaTitle({ left: "Team settings" }),
};

export default async function Page() {
  return pickPortalVersion(
    () => <TeamSettingsPageV3 />,
    () => <TeamSettingsPage />,
  );
}
