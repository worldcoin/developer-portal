"use client";

import { urls } from "@/lib/urls";
import { Icon, opticalIconClassName } from "@/scenes/PortalV3/common/Icon";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { useParams, useRouter } from "next/navigation";

export type DropdownTeam = { id: string; name: string };

const TeamAvatar = (props: { name: string; className?: string }) => (
  <div
    className={`flex shrink-0 items-center justify-center rounded-full bg-[#f5d1ff] font-world text-[11px] leading-none font-normal text-[#d501fd] ${props.className ?? ""}`}
  >
    {props.name[0]?.toUpperCase() ?? "T"}
  </div>
);

const TeamsDropdownRow = (props: {
  team: DropdownTeam;
  isCurrent: boolean;
  onSelect: () => void;
}) => (
  <DropdownMenu.Item
    onSelect={props.onSelect}
    className="flex h-12 w-full cursor-pointer items-center gap-2 rounded-8 bg-white px-4 py-2 font-world text-13 leading-[1.2] font-medium text-portal-text outline-hidden data-highlighted:bg-grey-50"
  >
    <TeamAvatar name={props.team.name} className="size-6" />
    <span className="min-w-0 flex-1 truncate">{props.team.name}</span>
    {props.isCurrent ? (
      <Icon
        name="dropdown-check"
        className={`${opticalIconClassName} size-4`}
      />
    ) : null}
  </DropdownMenu.Item>
);

export const TeamsDropdown = (props: { teams: DropdownTeam[] }) => {
  const router = useRouter();
  const { teams } = props;
  const { teamId } = useParams<{ teamId?: string }>();
  const currentTeam = teams.find((t) => t.id === teamId);

  return (
    <div className="px-4 pt-0 md:pt-4">
      <DropdownMenu.Root>
        <DropdownMenu.Trigger
          aria-label="Switch team"
          className="flex h-10 w-full min-w-0 items-center gap-2 rounded-8 px-0 text-left outline-hidden transition-colors hover:bg-portal-border focus-visible:bg-portal-border"
        >
          {currentTeam ? (
            <TeamAvatar name={currentTeam.name} className="size-6" />
          ) : (
            <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#f5d1ff] font-world text-[11px] font-normal text-[#d501fd]">
              T
            </div>
          )}

          <span className="grid min-w-0 flex-1 gap-0.5">
            <span className="truncate font-world text-13 leading-none font-medium text-portal-text">
              {currentTeam?.name ?? "Select team"}
            </span>
            <span className="font-world text-11 leading-none text-portal-subtle">
              Team
            </span>
          </span>

          <Icon
            name="arrow-separate-vertical"
            className={`${opticalIconClassName} size-4`}
          />
        </DropdownMenu.Trigger>

        <DropdownMenu.Portal>
          <DropdownMenu.Content
            align="start"
            sideOffset={16}
            collisionPadding={12}
            className="z-50 max-h-[60vh] w-[279px] overflow-y-auto rounded-[10px] border border-portal-border bg-white p-0 shadow-[0_18px_11px_0_rgba(24,24,24,0.02),0_8px_8px_0_rgba(24,24,24,0.03),0_2px_4px_0_rgba(24,24,24,0.03)]"
          >
            <div className="flex w-full flex-col items-start py-2">
              {teams.map((team) => (
                <TeamsDropdownRow
                  key={team.id}
                  team={team}
                  isCurrent={team.id === currentTeam?.id}
                  onSelect={() => router.push(urls.teams({ team_id: team.id }))}
                />
              ))}
              <Icon name="generic-divider" className="h-2 w-full shrink-0" />
              <DropdownMenu.Item
                onSelect={() => router.push(urls.createTeam())}
                className="flex h-12 w-full cursor-pointer items-center gap-2 rounded-8 bg-white px-4 py-2 font-world text-13 leading-[1.2] font-medium text-portal-text outline-hidden data-highlighted:bg-grey-50"
              >
                <Icon
                  name="dropdown-plus"
                  className={`${opticalIconClassName} size-4`}
                />
                <span className="min-w-0 flex-1 truncate">Create new team</span>
              </DropdownMenu.Item>
            </div>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </div>
  );
};
