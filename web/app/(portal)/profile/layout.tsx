import { pickPortalVersion } from "@/lib/feature-flags/portal-v3/activation";
import { ProfileLayout } from "@/scenes/Portal/Profile/layout";
import { ReactNode } from "react";

export default async function Layout(props: { children: ReactNode }) {
  return pickPortalVersion(
    () => props.children,
    () => <ProfileLayout>{props.children}</ProfileLayout>,
  );
}
