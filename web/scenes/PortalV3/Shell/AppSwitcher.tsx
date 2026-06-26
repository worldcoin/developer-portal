"use client";

import { CaretIcon } from "@/components/Icons/CaretIcon";
import { urls } from "@/lib/urls";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import clsx from "clsx";
import { useRouter } from "next/navigation";

export type AppSwitcherApp = { id: string; name: string };

/**
 * Content-header app switcher (presentational). Vercel-style, token-styled.
 * Receives the app list as props (fetched by AppSwitcherContainer) so it stays
 * pure and testable. No "All Apps" entry — the apps grid is reached via the
 * team name. "Create app" routes to the grid for now (create dialog later).
 */
export const AppSwitcher = (props: {
  teamId: string;
  currentAppId?: string;
  apps: AppSwitcherApp[];
  onCreateApp?: () => void;
}) => {
  const router = useRouter();
  const { teamId, currentAppId, apps, onCreateApp } = props;

  if (apps.length === 0) {
    return (
      <button
        onClick={() => onCreateApp?.()}
        className="flex items-center gap-2 rounded-8 border border-border px-2.5 py-1.5 font-gta text-14 font-medium text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
      >
        Create app
      </button>
    );
  }

  const current = apps.find((app) => app.id === currentAppId);

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger className="flex items-center gap-2 rounded-8 border border-border px-2.5 py-1.5 font-gta text-14 font-medium text-foreground outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring">
        <span className="max-w-[220px] truncate">
          {current?.name ?? "Select app"}
        </span>
        <CaretIcon className="size-3 text-muted-foreground" />
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="start"
          sideOffset={6}
          className="z-50 max-h-[60vh] min-w-[240px] overflow-y-auto rounded-12 border border-border bg-card p-1 text-foreground shadow-lg"
        >
          {apps.map((app) => (
            <DropdownMenu.Item
              key={app.id}
              onSelect={() =>
                router.push(urls.app({ team_id: teamId, app_id: app.id }))
              }
              className={clsx(
                "flex cursor-pointer items-center gap-3 rounded-8 px-2.5 py-1.5 font-gta text-14 outline-none data-[highlighted]:bg-muted",
                app.id === currentAppId && "font-medium",
              )}
            >
              <span className="truncate">{app.name}</span>
            </DropdownMenu.Item>
          ))}
          <DropdownMenu.Separator className="my-1 h-px bg-border" />
          <DropdownMenu.Item
            onSelect={() => onCreateApp?.()}
            className="flex cursor-pointer items-center gap-2 rounded-8 px-2.5 py-1.5 font-gta text-14 text-muted-foreground outline-none data-[highlighted]:bg-muted data-[highlighted]:text-foreground"
          >
            Create app
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
};
