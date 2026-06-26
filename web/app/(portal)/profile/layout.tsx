import { isPortalV3EnabledServer } from "@/lib/feature-flags/portal-v3";
import { ProfileLayout } from "@/scenes/Portal/Profile/layout";
import { AccountShell } from "@/scenes/PortalV3/Shell/AccountShell";
import { ReactNode } from "react";

export default async function Layout(props: { children: ReactNode }) {
  const isV3 = await isPortalV3EnabledServer();
  if (isV3) {
    return <AccountShell>{props.children}</AccountShell>;
  }
  return <ProfileLayout>{props.children}</ProfileLayout>;
}
