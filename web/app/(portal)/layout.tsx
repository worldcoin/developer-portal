import { pickPortalComponent } from "@/lib/feature-flags/portal-v3/render-portal-scene";
import { PortalLayout } from "@/scenes/Portal/layout";
import { PortalLayoutV3 } from "@/scenes/PortalV3/layout";
import { ComponentProps } from "react";

export default function PortalRootLayout(
  props: ComponentProps<typeof PortalLayout>,
) {
  const Layout = pickPortalComponent(PortalLayout, PortalLayoutV3);
  return <Layout {...props} />;
}
