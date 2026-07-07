import { pickPortalVersion } from "@/lib/feature-flags/portal-v3/activation";
import { generateMetaTitle } from "@/lib/genarate-title";
import { CreateTeamPage } from "@/scenes/Onboarding/CreateTeam/page";
import { CreateTeamPage as CreateTeamPageV3 } from "@/scenes/PortalV3/Onboarding/CreateTeam/page";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: generateMetaTitle({ left: "Create team" }),
};

type Props = { params: Promise<Record<string, string>> };

export default async function Page(props: Props) {
  return pickPortalVersion(
    () => <CreateTeamPageV3 params={props.params} />,
    () => <CreateTeamPage params={props.params} />,
  );
}
