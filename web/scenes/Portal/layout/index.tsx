import { calculateColorFromString } from "@/lib/calculate-color-from-string";
import { Auth0SessionUser } from "@/lib/types";
import { auth0 } from "@/lib/auth0";
import { isPortalV3EnabledServer } from "@/lib/feature-flags";
import { ReactNode } from "react";
import { Header } from "./Header";

export const PortalLayout = async (props: { children: ReactNode }) => {
  // Check v3 first — v3 routes have their own shell so the legacy Header and
  // session/color work below are not needed.
  if (await isPortalV3EnabledServer()) {
    return <>{props.children}</>;
  }

  const session = await auth0.getSession();
  const user = session?.user as Auth0SessionUser["user"];
  const initialColor = calculateColorFromString(
    user?.name ?? user?.email ?? user?.sid,
  );

  return (
    <div className="grid min-h-[100dvh] grid-rows-[auto_1fr]">
      <Header color={initialColor} />
      {props.children}
    </div>
  );
};
