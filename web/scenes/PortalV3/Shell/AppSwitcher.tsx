"use client";

import { CaretIcon } from "@/components/Icons/CaretIcon";
import { urls } from "@/lib/urls";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import Link from "next/link";

export type AppSwitcherApp = {
  id: string;
  name: string;
};

export const AppSwitcher = (props: {
  teamId: string;
  currentAppId?: string;
  apps: AppSwitcherApp[];
  onCreateApp: () => void;
}) => {
  const currentApp = props.apps.find((app) => app.id === props.currentAppId);

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger className="flex h-9 max-w-[280px] items-center gap-2 rounded-8 border border-border bg-card px-3 font-gta text-14 font-medium text-foreground outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring">
        <span className="truncate">{currentApp?.name ?? "Select app"}</span>
        <CaretIcon className="size-3 shrink-0 text-muted-foreground" />
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          side="bottom"
          align="start"
          sideOffset={8}
          className="z-50 min-w-[224px] rounded-12 border border-border bg-card p-1 text-foreground shadow-lg"
        >
          {props.apps.map((app) => (
            <DropdownMenu.Item key={app.id} asChild>
              <Link
                href={urls.app({ team_id: props.teamId, app_id: app.id })}
                className="flex rounded-8 px-2.5 py-2 font-gta text-14 outline-none data-[highlighted]:bg-muted"
              >
                <span className="truncate">{app.name}</span>
              </Link>
            </DropdownMenu.Item>
          ))}
          <DropdownMenu.Separator className="my-1 h-px bg-border" />
          <DropdownMenu.Item
            onSelect={props.onCreateApp}
            className="cursor-pointer rounded-8 px-2.5 py-2 font-gta text-14 text-muted-foreground outline-none data-[highlighted]:bg-muted data-[highlighted]:text-foreground"
          >
            Create app
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
};
