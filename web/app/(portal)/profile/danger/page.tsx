import { pickPortalVersion } from "@/lib/feature-flags/portal-v3/activation";
import { generateMetaTitle } from "@/lib/genarate-title";
import { DangerZone } from "@/scenes/Portal/Profile/DangerZone/page";
import { DangerZone as DangerZoneV3 } from "@/scenes/PortalV3/Profile/DangerZone/page";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: generateMetaTitle({ left: "Danger zone" }),
};

export default async function Page() {
  return pickPortalVersion(
    () => <DangerZoneV3 />,
    () => <DangerZone />,
  );
}
