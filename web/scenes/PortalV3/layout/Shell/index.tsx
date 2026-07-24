import type { SandboxAccessRequestState } from "@/api/v2/sandbox-access-request/server/fetch-sandbox-access-request";
import { calculateColorFromString } from "@/lib/calculate-color-from-string";
import { ReactNode } from "react";
import { AppsDropdown } from "./AppsDropdown";
import { ShellFrame } from "./ShellFrame";
import { SidebarNav } from "./SidebarNav";
import { TeamsDropdown } from "./TeamsDropdown";
import { UserPopup } from "./UserPopup";

/** Portal shell, mounted at the (portal) root for allow-listed users. */
export const PortalShell = (props: {
  user: { name?: string | null; email?: string | null };
  teams?: { id: string; name: string }[];
  sandboxRequest?: SandboxAccessRequestState | null;
  children?: ReactNode;
}) => {
  const { user, teams = [], sandboxRequest = null, children } = props;
  const color = calculateColorFromString(user.name ?? user.email ?? "");

  return (
    <ShellFrame
      appSwitcher={<AppsDropdown />}
      sidebar={
        <>
          <TeamsDropdown teams={teams} />
          <SidebarNav initialSandboxRequest={sandboxRequest} />

          <div className="mt-auto px-4 pb-4">
            <UserPopup
              user={{
                name: user.name ?? user.email ?? "Account",
                email: user.email ?? undefined,
              }}
              color={color}
            />
          </div>
        </>
      }
    >
      {children}
    </ShellFrame>
  );
};
