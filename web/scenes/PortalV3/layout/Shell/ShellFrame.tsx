import { Color } from "@/scenes/Portal/Profile/types";
import { ReactNode } from "react";
import { ColorInitializer } from "./ColorInitializer";
import { UserPopup } from "./UserPopup";

export const ShellFrame = (props: {
  color: Color | null;
  user: { name: string; email?: string } | null;
  nav: ReactNode;
  topSlot?: ReactNode;
  header?: ReactNode;
  children: ReactNode;
}) => {
  const { color, user, nav, topSlot, header, children } = props;

  return (
    <div
      data-testid="portal-v3-shell"
      className="grid min-h-[100dvh] bg-background text-foreground"
      style={{ gridTemplateColumns: "clamp(4rem, 20%, 16rem) 1fr" }}
    >
      <aside className="sticky top-0 flex h-[100dvh] flex-col border-r border-border bg-sidebar">
        <ColorInitializer color={color} />
        {topSlot ?? null}

        {nav}

        {user ? (
          <div className="border-t border-border p-2">
            <UserPopup user={{ name: user.name, email: user.email }} />
          </div>
        ) : null}
      </aside>

      <div className="flex min-w-0 flex-col">
        {header ? (
          <header className="flex h-14 items-center gap-3 border-b border-border px-4">
            {header}
          </header>
        ) : null}
        <main className="min-w-0 flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
};
