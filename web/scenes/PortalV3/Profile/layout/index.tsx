import { CloseIcon } from "@/components/Icons/CloseIcon";
import Link from "next/link";
import { ReactNode } from "react";

/**
 * Minimal v3 chrome for the account area (/profile/**). Mirrors the v3 shell's
 * grid (left rail + content) but the rail holds ONLY a close-X — no nav, no
 * team/app switcher, no account tabs. The v2 account page renders as-is in the
 * content column. The X returns to the main app ("/" resolves a signed-in user
 * back to their team's dashboard). Used for User profile and My Teams.
 */
export const ProfileLayoutV3 = (props: { children: ReactNode }) => {
  return (
    <div
      data-testid="portal-v3-account-shell"
      className="grid min-h-[100dvh] bg-background text-foreground"
      style={{ gridTemplateColumns: "clamp(4rem, 20%, 16rem) 1fr" }}
    >
      <aside className="sticky top-0 flex h-[100dvh] flex-col border-r border-border">
        <div className="flex h-14 items-center border-b border-border px-3">
          <Link
            href="/"
            aria-label="Back to dashboard"
            className="flex size-8 items-center justify-center rounded-8 text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
          >
            <CloseIcon className="size-4" strokeWidth={1.5} />
          </Link>
        </div>
      </aside>

      <div className="flex min-w-0 flex-col">
        <div className="h-14 shrink-0 border-b border-border" />
        <main className="min-w-0 flex-1 overflow-auto">{props.children}</main>
      </div>
    </div>
  );
};
