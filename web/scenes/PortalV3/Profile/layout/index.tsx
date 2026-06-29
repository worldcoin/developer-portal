import { V3Shell } from "@/scenes/PortalV3/Shell";
import { ReactNode } from "react";

export const ProfileLayoutV3 = (props: { children: ReactNode }) => (
  <V3Shell>{props.children}</V3Shell>
);
