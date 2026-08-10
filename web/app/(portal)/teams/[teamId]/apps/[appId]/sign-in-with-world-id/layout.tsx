import { SignInWithWorldIdLayout } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/SignInWithWorldId/layout";
import { ReactNode } from "react";

export default function Layout(props: {
  params: Promise<Record<string, string>>;
  children: ReactNode;
}) {
  return (
    <SignInWithWorldIdLayout params={props.params}>
      {props.children}
    </SignInWithWorldIdLayout>
  );
}
