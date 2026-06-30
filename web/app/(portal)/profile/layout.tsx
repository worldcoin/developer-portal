import { pickPortalComponent } from "@/lib/feature-flags/portal-v3/render-portal-scene";
import { ProfileLayout } from "@/scenes/Portal/Profile/layout";
import { ProfileLayoutV3 } from "@/scenes/PortalV3/Profile/layout";
import { ComponentProps } from "react";

export default function ProfileRouteLayout(
  props: ComponentProps<typeof ProfileLayout>,
) {
  const Layout = pickPortalComponent(ProfileLayout, ProfileLayoutV3);
  return <Layout {...props} />;
}
