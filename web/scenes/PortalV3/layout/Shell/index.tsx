import { calculateColorFromString } from "@/lib/calculate-color-from-string";
import { ReactNode } from "react";
import { AppsDropdown } from "./AppsDropdown";
import { SidebarNav } from "./SidebarNav";
import { ShellFrame } from "./ShellFrame";
import { TeamsDropdown } from "./TeamsDropdown";
import { UserPopup } from "./UserPopup";

/** Portal shell, mounted at the (portal) root for allow-listed users. */
export const PortalShell = (props: {
  user: { name?: string | null; email?: string | null };
  teams?: { id: string; name: string }[];
  children?: ReactNode;
}) => {
  const { user, teams = [], children } = props;
  const color = calculateColorFromString(user.name ?? user.email ?? "");

  return (
    <ShellFrame
      appSwitcher={<AppsDropdown />}
      sidebar={
        <>
          <TeamsDropdown teams={teams} />
          <SidebarNav />

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
