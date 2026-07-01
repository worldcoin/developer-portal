import { pickPortalVersion } from "@/lib/feature-flags/portal-v3/activation";
import { generateMetaTitle } from "@/lib/genarate-title";
import { SignInWithWorldIdPage } from "@/scenes/Portal/Teams/TeamId/Apps/AppId/SignInWithWorldId/page";
import { SignInWithWorldIdPage as SignInWithWorldIdPageV3 } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/SignInWithWorldId/page";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: generateMetaTitle({ left: "Sign in with World ID" }),
};

export default async function Page(props: {
  params: Promise<Record<string, string>>;
}) {
  const params = await props.params;
  return pickPortalVersion(
    () => <SignInWithWorldIdPageV3 params={params} />,
    () => <SignInWithWorldIdPage params={params} />,
  );
}
