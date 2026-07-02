import { pickPortalVersion } from "@/lib/feature-flags/portal-v3/activation";
import { generateMetaTitle } from "@/lib/genarate-title";
import { TeamApiKeysPage } from "@/scenes/Portal/Teams/TeamId/Team/ApiKeys/page";
import { TeamApiKeysPage as TeamApiKeysPageV3 } from "@/scenes/PortalV3/Teams/TeamId/Team/ApiKeys/page";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: generateMetaTitle({ left: "API keys" }),
};

type Props = { params: Promise<Record<string, string>> };

export default async function Page(props: Props) {
  return pickPortalVersion(
    () => <TeamApiKeysPageV3 params={props.params} />,
    () => <TeamApiKeysPage params={props.params} />,
  );
}
