import { SignInWithWorldIdLayout as SignInWithWorldIdLayoutV3 } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/SignInWithWorldId/layout";
import { ReactNode } from "react";

export default async function Layout(props: {
  params: Promise<Record<string, string>>;
  children: ReactNode;
}) {
  return (
    <SignInWithWorldIdLayoutV3 params={props.params}>
      {props.children}
    </SignInWithWorldIdLayoutV3>
  );
}
