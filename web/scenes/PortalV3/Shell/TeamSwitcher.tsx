"use client";

import { CaretIcon } from "@/components/Icons/CaretIcon";
import { Placeholder } from "@/components/PlaceholderImage";
import { urls } from "@/lib/urls";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import clsx from "clsx";
import Link from "next/link";
import { useRouter } from "next/navigation";

export type SwitcherTeam = { id: string; name: string };

/**
 * Sidebar-header team switcher (presentational). Two targets, Vercel-style:
 * clicking the team name goes to the apps grid; the chevron opens a dropdown to
 * switch teams (or create one).
 */
export const TeamSwitcher = (props: {
  currentTeam: SwitcherTeam;
  teams: SwitcherTeam[];
}) => {
  const router = useRouter();
  const { currentTeam, teams } = props;

  return (
    <div className="flex h-14 items-center gap-1 border-b border-border px-2">
      <Link
        href={urls.apps({ team_id: currentTeam.id })}
        className="flex min-w-0 flex-1 items-center gap-2.5 rounded-8 px-1.5 py-1.5 outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Placeholder
          name={currentTeam.name}
          seed={currentTeam.id}
          className="size-6 shrink-0 text-xs"
        />
        <span className="min-w-0 flex-1 truncate font-gta text-14 font-medium">
          {currentTeam.name}
        </span>
      </Link>

      <DropdownMenu.Root>
        <DropdownMenu.Trigger
          aria-label="Switch team"
          className="flex size-7 shrink-0 items-center justify-center rounded-8 text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
        >
          <CaretIcon className="size-3" />
        </DropdownMenu.Trigger>

        <DropdownMenu.Portal>
          <DropdownMenu.Content
            align="start"
            sideOffset={6}
            className="z-50 max-h-[60vh] min-w-[224px] overflow-y-auto rounded-12 border border-border bg-card p-1 text-foreground shadow-lg"
          >
            {teams.map((team) => (
              <DropdownMenu.Item
                key={team.id}
                onSelect={() => router.push(urls.teams({ team_id: team.id }))}
                className={clsx(
                  "flex cursor-pointer items-center gap-2 rounded-8 px-2.5 py-1.5 font-gta text-14 outline-none data-[highlighted]:bg-muted",
                  team.id === currentTeam.id && "font-medium",
                )}
              >
                <Placeholder
                  name={team.name}
                  seed={team.id}
                  className="size-5 shrink-0 text-xs"
                />
                <span className="truncate">{team.name}</span>
              </DropdownMenu.Item>
            ))}
            <DropdownMenu.Separator className="my-1 h-px bg-border" />
            <DropdownMenu.Item
              onSelect={() => router.push(urls.createTeam())}
              className="flex cursor-pointer items-center gap-2 rounded-8 px-2.5 py-1.5 font-gta text-14 text-muted-foreground outline-none data-[highlighted]:bg-muted data-[highlighted]:text-foreground"
            >
              Create team
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </div>
  );
};
