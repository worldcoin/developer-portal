import {
  Dropdown,
  DropdownButton,
  DropdownItem,
  DropdownItems,
} from "@/components/Dropdown";

import { Button } from "@/components/Button";
import { AddCircleIcon } from "@/components/Icons/AddCircleIcon";
import { CheckmarkCircleIcon } from "@/components/Icons/CheckmarkCircleIcon";
import { LoginSquareIcon } from "@/components/Icons/LoginSquareIcon";
import { useFetchTeamsQuery } from "@/components/LoggedUserNav/TeamSwitch/graphql/client/fetch-teams.generated";
import { Auth0SessionUser } from "@/lib/types";
import { urls } from "@/lib/urls";
import { useUser } from "@auth0/nextjs-auth0/client";
import Link from "next/link";
import { TeamLogo } from "./TeamLogo";

export const TeamSwitch = (props: { selectedTeamId?: string }) => {
  const { user } = useUser() as Auth0SessionUser;

  const teamsQueryRes = useFetchTeamsQuery({
    context: { headers: { team_id: "_" } },
    skip: !user?.hasura,
    fetchPolicy: "cache-and-network", // NOTE: To make it refetch after create-team
  });

  return (
    <div className="-mx-4 -my-2.5">
      <Dropdown placement="left-start">
        <DropdownButton>
          <div className="grid grid-cols-auto/1fr items-center gap-x-2 px-4 py-2.5">
            <LoginSquareIcon className="size-4 text-grey-400" /> Switch team
          </div>
        </DropdownButton>

        <DropdownItems className="relative -left-1 -top-1">
          <div className="px-4 py-2.5 text-14 leading-5 text-grey-400">
            Teams
          </div>

          {teamsQueryRes.data?.teams.map((team) => (
            <DropdownItem key={team.id} className="hover:bg-grey-50">
              <Link
                href={`/teams/${team.id}`}
                className="grid grid-cols-auto/1fr/auto items-center gap-x-2"
              >
                <TeamLogo
                  src={""}
                  name={
                    team.name ?? "" /*FIXME: team.name must be non nullable*/
                  }
                />

                {team.name}

                {team.id === props.selectedTeamId && (
                  <CheckmarkCircleIcon className="text-blue-500" />
                )}
              </Link>
            </DropdownItem>
          ))}

          <DropdownItem className="hover:bg-grey-50">
            <Button
              href={urls.createTeam()}
              className="grid grid-cols-auto/1fr items-center gap-x-2"
            >
              <AddCircleIcon className="size-4 text-grey-400" /> Create new team
            </Button>
          </DropdownItem>
        </DropdownItems>
      </Dropdown>
    </div>
  );
};
