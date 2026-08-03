import { Dropdown } from "components/Dropdown";
import { AddCircleIcon } from "@/components/Icons/AddCircleIcon";
import { CheckmarkCircleIcon } from "@/components/Icons/CheckmarkCircleIcon";
import { FetchTeamsDocument } from "@/components/LoggedUserNav/Teams/graphql/client/fetch-teams.generated";
import type { Auth0SessionUser } from "@/lib/types";
import { useCreateTeamDialog } from "@/scenes/Onboarding/CreateTeam/useCreateTeamDialog";
import { useUser } from "@auth0/nextjs-auth0/client";
import { useQuery } from "@apollo/client/react";
import Link from "next/link";
import { TeamLogo } from "./TeamLogo";

export const Teams = (props: { selectedTeamId?: string }) => {
  const { user } = useUser() as Auth0SessionUser;
  const { open: openCreateTeamDialog } = useCreateTeamDialog();

  const teamsQueryRes = useQuery(FetchTeamsDocument, {
    skip: !user?.hasura,
    fetchPolicy: "cache-and-network", // NOTE: To make it refetch after create-team
  });

  return (
    <>
      {teamsQueryRes.data?.teams.map((team) => (
        <Dropdown.ListItem key={team.id} asChild>
          <Link href={`/teams/${team.id}`}>
            <TeamLogo
              className="size-6 text-xs md:size-4"
              src={""}
              name={team.name ?? ""}
            />

            <Dropdown.ListItemText className="truncate md:leading-4!">
              {team.name}
            </Dropdown.ListItemText>

            {team.id === props.selectedTeamId && (
              <CheckmarkCircleIcon className="size-5 text-blue-500 md:size-4" />
            )}
          </Link>
        </Dropdown.ListItem>
      ))}

      <Dropdown.ListItem onSelect={openCreateTeamDialog}>
        <Dropdown.ListItemIcon asChild>
          <AddCircleIcon />
        </Dropdown.ListItemIcon>

        <Dropdown.ListItemText>Create new team</Dropdown.ListItemText>
      </Dropdown.ListItem>
    </>
  );
};
