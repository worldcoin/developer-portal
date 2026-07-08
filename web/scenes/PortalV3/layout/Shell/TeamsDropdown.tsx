"use client";

import { Placeholder } from "@/components/PlaceholderImage";
import { urls } from "@/lib/urls";
import { Icon } from "@/scenes/PortalV3/common/Icon";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import clsx from "clsx";
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
      "flex cursor-pointer items-center gap-2 rounded-8 px-2.5 py-1.5 font-gta text-14 outline-none data-[highlighted]:bg-grey-100",
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
    <div className="px-4 pt-4">
      <DropdownMenu.Root>
        <DropdownMenu.Trigger
          aria-label="Switch team"
          className="flex h-10 w-full min-w-0 items-center gap-2 rounded-8 px-0 text-left outline-none transition-colors hover:bg-portal-border focus-visible:ring-2 focus-visible:ring-grey-300"
        >
          {currentTeam ? (
            <Placeholder
              name={currentTeam.name}
              seed={currentTeam.id}
              className="size-6 shrink-0 rounded-full text-10 font-semibold"
            />
          ) : (
            <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-grey-200 font-world text-10 font-semibold text-portal-muted">
              T
            </div>
          )}

          <span className="grid min-w-0 flex-1 gap-0.5">
            <span className="truncate font-world text-13 font-medium leading-none text-portal-text">
              {currentTeam?.name ?? "Select team"}
            </span>
            <span className="font-world text-11 leading-none text-portal-subtle">
              Team
            </span>
          </span>

          <Icon name="arrow-separate-vertical" className="size-4 shrink-0" />
        </DropdownMenu.Trigger>

        <DropdownMenu.Portal>
          <DropdownMenu.Content
            align="start"
            sideOffset={6}
            collisionPadding={12}
            className="z-50 max-h-[60vh] w-[247px] overflow-y-auto rounded-12 border border-portal-border bg-white p-1 shadow-lg"
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
              className="text-muted-foreground flex cursor-pointer items-center gap-2 rounded-8 px-2.5 py-1.5 font-gta text-14 outline-none data-[highlighted]:bg-grey-100"
            >
              Create team
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </div>
  );
};
