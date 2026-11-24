"use client";

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { urls } from "@/lib/urls";
import { cn } from "@/lib/utils";
import { useCreateTeamDialog } from "@/scenes/Onboarding/CreateTeam/useCreateTeamDialog";
import { ChevronsUpDownIcon } from "lucide-react";
import { useParams } from "next/navigation";
import { useMemo } from "react";
import {
  SearchableSwitcher,
  switcherTriggerClassName,
} from "./SearchableSwitcher";

export type DropdownTeam = { id: string; name: string };

export const TeamsDropdown = (props: { teams: DropdownTeam[] }) => {
  const { open: openCreateTeamDialog } = useCreateTeamDialog();
  const { teamId } = useParams<{ teamId?: string }>();
  const teams = useMemo(
    () =>
      [...props.teams].sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
      ),
    [props.teams],
  );
  const currentTeam = teams.find((team) => team.id === teamId);

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SearchableSwitcher
          items={teams}
          selectedId={teamId}
          renderTrigger={(open) => (
            <SidebarMenuButton
              aria-label="Switch team"
              aria-expanded={open}
              title="Switch team"
              size="lg"
              className={cn(
                switcherTriggerClassName,
                "text-portal-text hover:bg-portal-border focus-visible:bg-portal-border focus-visible:ring-0 aria-expanded:bg-portal-border",
              )}
            >
              <span className="min-w-0 flex-1 truncate font-world text-13 leading-none font-medium group-data-[collapsible=icon]:hidden">
                {currentTeam?.name ?? "Select team"}
              </span>
              <ChevronsUpDownIcon className="ml-auto size-4 text-portal-muted group-data-[collapsible=icon]:m-auto" />
            </SidebarMenuButton>
          )}
          getItemHref={(team) => urls.teams({ team_id: team.id })}
          searchLabel="Find a team"
          listLabel="Teams"
          emptyLabel="No teams, yet"
          noResultsLabel="No teams found"
          createAction={{
            label: "Create new team",
            onSelect: openCreateTeamDialog,
          }}
          side="bottom"
          testIdPrefix="team"
        />
      </SidebarMenuItem>
    </SidebarMenu>
  );
};
