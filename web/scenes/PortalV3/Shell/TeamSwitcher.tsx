"use client";

import { CaretIcon } from "@/components/Icons/CaretIcon";
import { urls } from "@/lib/urls";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import Link from "next/link";

export type TeamSwitcherTeam = {
  id: string;
  name: string;
};

const avatarClass =
  "flex size-6 shrink-0 items-center justify-center rounded-full bg-accent-muted font-gta text-12 font-medium uppercase text-accent";

export const TeamSwitcher = (props: {
  currentTeam: TeamSwitcherTeam;
  teams: TeamSwitcherTeam[];
}) => (
  <DropdownMenu.Root>
    <DropdownMenu.Trigger className="flex h-14 w-full items-center gap-2 border-b border-border px-3 text-left outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring">
      <div className={avatarClass}>{props.currentTeam.name[0]}</div>
      <span className="min-w-0 flex-1 truncate font-gta text-14 font-medium text-sidebar-foreground">
        {props.currentTeam.name}
      </span>
      <CaretIcon className="size-3 shrink-0 text-muted-foreground" />
    </DropdownMenu.Trigger>

    <DropdownMenu.Portal>
      <DropdownMenu.Content
        side="bottom"
        align="start"
        sideOffset={6}
        className="z-50 min-w-[224px] rounded-12 border border-border bg-card p-1 text-foreground shadow-lg"
      >
        {props.teams.map((team) => (
          <DropdownMenu.Item key={team.id} asChild>
            <Link
              href={urls.teams({ team_id: team.id })}
              className="flex items-center gap-2 rounded-8 px-2.5 py-2 font-gta text-14 outline-none data-[highlighted]:bg-muted"
            >
              <span className={avatarClass}>{team.name[0]}</span>
              <span className="truncate">{team.name}</span>
            </Link>
          </DropdownMenu.Item>
        ))}
        <DropdownMenu.Separator className="my-1 h-px bg-border" />
        <DropdownMenu.Item asChild>
          <Link
            href={urls.createTeam()}
            className="flex rounded-8 px-2.5 py-2 font-gta text-14 text-muted-foreground outline-none data-[highlighted]:bg-muted data-[highlighted]:text-foreground"
          >
            Create team
          </Link>
        </DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu.Portal>
  </DropdownMenu.Root>
);
