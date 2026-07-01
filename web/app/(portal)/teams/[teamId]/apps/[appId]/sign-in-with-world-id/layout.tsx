import { pickPortalVersion } from "@/lib/feature-flags/portal-v3/activation";
import { SignInWithWorldIdLayout } from "@/scenes/Portal/Teams/TeamId/Apps/AppId/SignInWithWorldId/layout";
import { SignInWithWorldIdLayout as SignInWithWorldIdLayoutV3 } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/SignInWithWorldId/layout";
import { ReactNode } from "react";

export default async function Layout(props: {
  params: Promise<Record<string, string>>;
  children: ReactNode;
}) {
  return pickPortalVersion(
    () => (
      <SignInWithWorldIdLayoutV3 params={props.params}>
        {props.children}
      </SignInWithWorldIdLayoutV3>
    ),
    () => (
      <SignInWithWorldIdLayout params={props.params}>
        {props.children}
      </SignInWithWorldIdLayout>
    ),
  );
}
