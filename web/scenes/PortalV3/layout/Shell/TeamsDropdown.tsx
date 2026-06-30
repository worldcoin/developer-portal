"use client";

import { CaretIcon } from "@/components/Icons/CaretIcon";
import { WorldIcon } from "@/components/Icons/WorldIcon";
import { Placeholder } from "@/components/PlaceholderImage";
import { urls } from "@/lib/urls";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import clsx from "clsx";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

export type DropdownTeam = { id: string; name: string };

const TeamsDropdownRow = (props: {
  team: DropdownTeam;
  isCurrent: boolean;
  onSelect: () => void;
}) => (
  <DropdownMenu.Item
    onSelect={props.onSelect}
    className={clsx(
      "data-[highlighted]:bg-muted flex cursor-pointer items-center gap-2 rounded-8 px-2.5 py-1.5 font-gta text-14 outline-none",
      props.isCurrent && "font-medium",
    )}
  >
    <Placeholder
      name={props.team.name}
      seed={props.team.id}
      className="size-5 shrink-0 text-xs"
    />
    <span className="truncate">{props.team.name}</span>
  </DropdownMenu.Item>
);

export const TeamsDropdown = (props: { teams: DropdownTeam[] }) => {
  const router = useRouter();
  const { teams } = props;
  const { teamId } = useParams<{ teamId?: string }>();
  const currentTeam = teams.find((t) => t.id === teamId);

  return (
    <div className="border-border flex h-14 items-center gap-1 border-b px-2">
      {currentTeam ? (
        <Link
          href={urls.apps({ team_id: currentTeam.id })}
          className="hover:bg-muted focus-visible:ring-ring flex min-w-0 flex-1 items-center gap-2.5 rounded-8 p-1.5 outline-none focus-visible:ring-2"
        >
          <WorldIcon className="size-6 shrink-0" />
          <span className="min-w-0 flex-1 truncate font-gta text-14 font-medium">
            {currentTeam.name}
          </span>
        </Link>
      ) : (
        <div className="flex min-w-0 flex-1 items-center gap-2.5 p-1.5">
          <WorldIcon className="size-6 shrink-0" />
          <span className="text-muted-foreground min-w-0 flex-1 truncate font-gta text-14 font-medium">
            Select team
          </span>
        </div>
      )}

      <DropdownMenu.Root>
        <DropdownMenu.Trigger
          aria-label="Switch team"
          className="text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-ring flex size-7 shrink-0 items-center justify-center rounded-8 outline-none focus-visible:ring-2"
        >
          <CaretIcon className="size-3" />
        </DropdownMenu.Trigger>

        <DropdownMenu.Portal>
          <DropdownMenu.Content
            align="end"
            sideOffset={6}
            collisionPadding={12}
            className="border-border bg-card text-foreground z-50 max-h-[60vh] w-[232px] overflow-y-auto rounded-12 border p-1 shadow-lg"
          >
            {teams.map((team) => (
              <TeamsDropdownRow
                key={team.id}
                team={team}
                isCurrent={team.id === currentTeam?.id}
                onSelect={() => router.push(urls.teams({ team_id: team.id }))}
              />
            ))}
            <DropdownMenu.Separator className="bg-border my-1 h-px" />
            <DropdownMenu.Item
              onSelect={() => router.push(urls.createTeam())}
              className="text-muted-foreground data-[highlighted]:bg-muted data-[highlighted]:text-foreground flex cursor-pointer items-center gap-2 rounded-8 px-2.5 py-1.5 font-gta text-14 outline-none"
            >
              Create team
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </div>
  );
};
