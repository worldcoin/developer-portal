import { Color } from "@/scenes/Portal/Profile/types";
import { ReactNode } from "react";
import { UserPopup } from "./UserPopup";

/**
 * The single v3 shell grid: a left rail (slots: topSlot / nav / bottom user
 * menu) and a content column (header bar + scrollable main). Both the full
 * portal shell (V3Shell) and the minimal account chrome (ProfileLayoutV3)
 * compose this — one grid implementation, no drift.
 */
export const ShellFrame = (props: {
  testId?: string;
  color: Color | null;
  user: { name: string; email?: string } | null;
  nav?: ReactNode;
  topSlot?: ReactNode;
  header?: ReactNode;
  children: ReactNode;
}) => {
  const {
    testId = "portal-v3-shell",
    color,
    user,
    nav,
    topSlot,
    header,
    children,
  } = props;

  return (
    <div
      data-testid={testId}
      className="grid min-h-[100dvh] bg-background text-foreground"
      style={{ gridTemplateColumns: "clamp(4rem, 20%, 16rem) 1fr" }}
    >
      <aside className="sticky top-0 flex h-[100dvh] flex-col border-r border-border bg-sidebar">
        {topSlot ?? null}

        {nav}

        {user ? (
          <div className="mt-auto border-t border-border p-2">
            <UserPopup
              user={{ name: user.name, email: user.email }}
              color={color}
            />
          </div>
        ) : null}
      </aside>

      <div className="flex min-w-0 flex-col">
        <header className="flex h-14 items-center gap-3 border-b border-border px-4">
          {header}
        </header>
        <main className="min-w-0 flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
};
