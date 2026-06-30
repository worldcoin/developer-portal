import { CloseIcon } from "@/components/Icons/CloseIcon";
import { calculateColorFromString } from "@/lib/calculate-color-from-string";
import Link from "next/link";
import { ReactNode } from "react";
import { AppsDropdown } from "./AppsDropdown";
import { SidebarNav } from "./SidebarNav";
import { TeamsDropdown } from "./TeamsDropdown";
import { UserPopup } from "./UserPopup";

/**
 * Portal shell, mounted per-section by the (portal) shims (the team layer for
 * "app", /profile for "account") — not at the portal root. `variant="app"` is
 * the full chrome (team switcher + sidebar nav + app header); `variant="account"`
 * is the focused /profile view: a close-X back to the dashboard and the bottom
 * user menu only. Current team/app are resolved client-side (useParams) inside
 * the dropdowns/nav — the shell takes no teamId/component props (per review on #1988).
 */
export const PortalShell = (props: {
  user: { name?: string | null; email?: string | null };
  teams?: { id: string; name: string }[];
  children?: ReactNode;
  variant?: "app" | "account";
}) => {
  const { user, teams = [], children, variant = "app" } = props;
  const color = calculateColorFromString(user.name ?? user.email ?? "");
  const isAccount = variant === "account";

  return (
    <div
      data-testid="portal-shell"
      className="bg-background text-foreground grid min-h-[100dvh]"
      style={{ gridTemplateColumns: "clamp(4rem, 20%, 16rem) 1fr" }}
    >
      <aside className="border-border bg-sidebar sticky top-0 flex h-[100dvh] flex-col border-r">
        {isAccount ? (
          <div className="border-border flex h-14 items-center border-b px-3">
            <Link
              href="/"
              aria-label="Back to dashboard"
              data-testid="portal-shell-close"
              className="text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-ring flex size-8 items-center justify-center rounded-8 outline-none transition-colors focus-visible:ring-2"
            >
              <CloseIcon className="size-4" />
            </Link>
          </div>
        ) : (
          <>
            <TeamsDropdown teams={teams} />
            <SidebarNav />
          </>
        )}

        <div className="border-border mt-auto border-t p-2">
          <UserPopup
            user={{
              name: user.name ?? user.email ?? "Account",
              email: user.email ?? undefined,
            }}
            color={color}
          />
        </div>
      </aside>

      <div className="flex min-w-0 flex-col">
        <header className="border-border flex h-14 items-center gap-3 border-b px-4">
          {!isAccount && <AppsDropdown />}
        </header>
        <main className="min-w-0 flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
};
