import { CloseIcon } from "@/components/Icons/CloseIcon";
import { auth0 } from "@/lib/auth0";
import { calculateColorFromString } from "@/lib/calculate-color-from-string";
import { Auth0SessionUser } from "@/lib/types";
import { ShellFrame } from "@/scenes/PortalV3/layout/Shell/ShellFrame";
import Link from "next/link";
import { ReactNode } from "react";

/**
 * Minimal v3 chrome for the account area (/profile/**): the shared ShellFrame
 * grid with only a close-X (topSlot) and the bottom user menu — no nav, no
 * team/app switcher, empty content header. The v2 account page renders as-is in
 * the content column. The X returns to the main app ("/" resolves a signed-in
 * user to their team's dashboard).
 */
export const ProfileLayoutV3 = async (props: { children: ReactNode }) => {
  const session = await auth0.getSession();
  const user = session?.user as Auth0SessionUser["user"];
  const color = calculateColorFromString(
    user?.name ?? user?.email ?? user?.sid,
  );

  return (
    <ShellFrame
      testId="portal-v3-account-shell"
      color={color}
      user={
        user
          ? { name: user.name ?? user.email ?? "Account", email: user.email }
          : null
      }
      topSlot={
        <div className="flex h-14 items-center border-b border-border px-3">
          <Link
            href="/"
            aria-label="Back to dashboard"
            className="flex size-8 items-center justify-center rounded-8 text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
          >
            <CloseIcon className="size-4" strokeWidth={1.5} />
          </Link>
        </div>
      }
    >
      {props.children}
    </ShellFrame>
  );
};
