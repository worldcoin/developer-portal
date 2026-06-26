import { calculateColorFromString } from "@/lib/calculate-color-from-string";
import { Auth0SessionUser } from "@/lib/types";
import { auth0 } from "@/lib/auth0";
import { isPortalV3EnabledServer } from "@/lib/feature-flags";
import { headers } from "next/headers";
import { ReactNode } from "react";
import { Header } from "./Header";

// Pull the teamId out of a /teams/<teamId>/... path.
const teamIdFromPath = (pathname: string | null): string | undefined =>
  pathname?.match(/^\/teams\/([^/]+)/)?.[1];

export const PortalLayout = async (props: { children: ReactNode }) => {
  const session = await auth0.getSession();
  const user = session?.user as Auth0SessionUser["user"];
  const initialColor = calculateColorFromString(
    user?.name ?? user?.email ?? user?.sid,
  );

  // The v3 shell renders its own chrome (sidebar), so suppress the legacy
  // Header on v3-enabled team routes. Everything else is unchanged, and this is
  // fail-closed: any non-v3 result keeps the legacy Header.
  const pathname = (await headers()).get("x-current-path");
  const teamId = teamIdFromPath(pathname);
  const isV3 = teamId ? await isPortalV3EnabledServer(teamId) : false;

  if (isV3) {
    return <>{props.children}</>;
  }

  return (
    <div className="grid min-h-[100dvh] grid-rows-[auto_1fr]">
      <Header color={initialColor} />
      {props.children}
    </div>
  );
};
