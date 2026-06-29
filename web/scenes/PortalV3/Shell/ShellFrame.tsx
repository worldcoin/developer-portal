import { ReactNode } from "react";

export const ShellFrame = (props: {
  sidebar: ReactNode;
  header: ReactNode;
  children: ReactNode;
}) => (
  <div
    data-testid="portal-v3-shell"
    className="grid min-h-[100dvh] bg-background text-foreground"
    style={{ gridTemplateColumns: "clamp(14rem, 17vw, 16rem) 1fr" }}
  >
    <aside className="sticky top-0 flex h-[100dvh] flex-col border-r border-border bg-sidebar">
      {props.sidebar}
    </aside>
    <div className="flex min-w-0 flex-col">
      <header className="flex h-14 items-center gap-3 border-b border-border px-4">
        {props.header}
      </header>
      <main className="min-w-0 flex-1 overflow-auto">{props.children}</main>
    </div>
  </div>
);
