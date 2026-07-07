import { pickPortalVersion } from "@/lib/feature-flags/portal-v3/activation";
import { generateMetaTitle } from "@/lib/genarate-title";
import { TeamDangerPage } from "@/scenes/Portal/Teams/TeamId/Team/Danger/page";
import { TeamDangerPage as TeamDangerPageV3 } from "@/scenes/PortalV3/Teams/TeamId/Team/Danger/page";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: generateMetaTitle({ left: "Danger zone" }),
};

export default async function Page() {
  return pickPortalVersion(
    () => <TeamDangerPageV3 />,
    () => <TeamDangerPage />,
  );
}
