import { auth0 } from "@/lib/auth0";
import { Auth0SessionUser } from "@/lib/types";
import { ReactNode } from "react";
import { PortalShell } from "./Shell";

/**
 * v3 shell layout, mounted per-section by the (portal) shims: the team shim
 * (variant="app") and the profile shim (variant="account"). NOT mounted at the
 * (portal) root — the root chooser goes thin for v3 so v3 routes never inherit
 * the v2 Header (no double-header). Auth is enforced in middleware; this layout
 * renders with whatever session exists and never redirects.
 */
export const PortalLayout = async (props: {
  children: ReactNode;
  variant?: "app" | "account";
}) => {
  const session = await auth0.getSession();
  const user = session?.user as Auth0SessionUser["user"];
  const teams = (user?.hasura?.memberships ?? [])
    .map((m) => m.team)
    .filter((t): t is NonNullable<typeof t> => !!t?.id)
    .map((t) => ({ id: t.id, name: t.name ?? "Untitled team" }));

  return (
    <PortalShell
      variant={props.variant ?? "app"}
      user={{ name: user?.name, email: user?.email }}
      teams={teams}
    >
      {props.children}
    </PortalShell>
  );
};
