import { Dropdown } from "components/Dropdown";
import { AddCircleIcon } from "@/components/Icons/AddCircleIcon";
import { CheckmarkCircleIcon } from "@/components/Icons/CheckmarkCircleIcon";
import { useFetchTeamsQuery } from "@/components/LoggedUserNav/Teams/graphql/client/fetch-teams.generated";
import { Auth0SessionUser } from "@/lib/types";
import { urls } from "@/lib/urls";
import { useUser } from "@auth0/nextjs-auth0/client";
import Link from "next/link";
import { TeamLogo } from "./TeamLogo";

export const Teams = (props: { selectedTeamId?: string }) => {
  const { user } = useUser() as Auth0SessionUser;

  const teamsQueryRes = useFetchTeamsQuery({
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

            <div className="truncate">{team.name}</div>

            {team.id === props.selectedTeamId && (
              <CheckmarkCircleIcon className="size-5 text-blue-500 md:size-4" />
            )}
          </Link>
        </Dropdown.ListItem>
      ))}

      <Dropdown.ListItem asChild>
        <Link href={urls.createTeam()}>
          <Dropdown.ListItemIcon asChild>
            <AddCircleIcon />
          </Dropdown.ListItemIcon>
          Create new team
        </Link>
      </Dropdown.ListItem>
    </>
  );
};
