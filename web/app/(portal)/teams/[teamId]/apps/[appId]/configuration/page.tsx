import { pickPortalVersion } from "@/lib/feature-flags/portal-v3/activation";
import { generateMetaTitle } from "@/lib/genarate-title";
import { AppProfilePage } from "@/scenes/Portal/Teams/TeamId/Apps/AppId/Configuration/page";
// The Q3 2026 wizard replaces the previous V3 configuration page; the old
// scene stays in the tree untouched so reverting is a one-line import swap.
import { ConfigurationWizardPage } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/Configuration/Wizard/page";
import { Metadata } from "next";

type Props = { params: Promise<{ teamId: string; appId: string }> };

export const metadata: Metadata = {
  title: generateMetaTitle({ left: "Overview" }),
};

export default async function Page(props: Props) {
  const params = await props.params;
  return pickPortalVersion(
    () => <ConfigurationWizardPage params={params} />,
    () => <AppProfilePage params={params} />,
  );
}
