import { auth0 } from "@/lib/auth0";
import { calculateColorFromString } from "@/lib/calculate-color-from-string";
import { Auth0SessionUser } from "@/lib/types";
import { ReactNode } from "react";
import { PortalChromeGate } from "./PortalChromeGate";

export const PortalLayoutV3 = async (props: { children: ReactNode }) => {
  const session = await auth0.getSession();
  const user = session?.user as Auth0SessionUser["user"];
  const color = calculateColorFromString(
    user?.name ?? user?.email ?? user?.sid,
  );

  return (
    <div className="grid min-h-[100dvh] grid-rows-[auto_1fr]">
      <PortalChromeGate color={color} />
      {props.children}
    </div>
  );
};
