"use client";

import { usePathname } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";

export const ShellFrame = (props: {
  sidebar: ReactNode;
  appSwitcher: ReactNode;
  children?: ReactNode;
}) => {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => setSidebarOpen(false), [pathname]);

  return (
    <div
      data-testid="portal-shell"
      className="grid min-h-[100dvh] grid-cols-1 bg-portal-canvas md:grid-cols-[280px_minmax(0,1fr)]"
    >
      {sidebarOpen ? (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 z-40 bg-black/20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      ) : null}

      <aside
        id="portal-sidebar"
        className={`fixed inset-y-0 left-0 z-50 flex h-[100dvh] w-[280px] flex-col bg-portal-canvas transition-transform md:sticky md:top-0 md:z-auto md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-12 shrink-0 items-center justify-end px-4 md:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            className="flex size-8 items-center justify-center rounded-8 text-20 text-portal-muted hover:bg-portal-border"
            onClick={() => setSidebarOpen(false)}
          >
            ×
          </button>
        </div>
        {props.sidebar}
      </aside>

      <div className="flex min-w-0 flex-col bg-white">
        <header className="flex h-[67px] shrink-0 items-center gap-3 border-b border-portal-border bg-portal-canvas px-4 md:items-end md:border-l md:pb-5 md:pl-[31px] md:pr-5">
          <button
            type="button"
            aria-label="Open navigation"
            aria-controls="portal-sidebar"
            aria-expanded={sidebarOpen}
            className="flex size-8 shrink-0 flex-col items-center justify-center gap-1 rounded-8 hover:bg-portal-border md:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="h-px w-4 bg-portal-text" />
            <span className="h-px w-4 bg-portal-text" />
            <span className="h-px w-4 bg-portal-text" />
          </button>
          {props.appSwitcher}
        </header>
        <main className="min-w-0 flex-1 overflow-auto bg-white md:border-l md:border-portal-border">
          {props.children}
        </main>
      </div>
    </div>
  );
};
