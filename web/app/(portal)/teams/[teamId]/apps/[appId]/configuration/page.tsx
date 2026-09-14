import { generateMetaTitle } from "@/lib/genarate-title";
import { ConfigurationWizardPage } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/Configuration/Wizard/page";
import { Metadata } from "next";

type Props = { params: Promise<{ teamId: string; appId: string }> };

export const metadata: Metadata = {
  title: generateMetaTitle({ left: "Overview" }),
};

export default async function Page(props: Props) {
  const params = await props.params;
  return <ConfigurationWizardPage params={params} />;
}
