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
import { TYPOGRAPHY, Typography } from "@/components/Typography";
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
    <div className="w-full">
      <Dropdown placement="left-start" zIndex={60}>
        <DropdownButton
          as="button"
          className="grid w-full grid-cols-auto/1fr items-center justify-items-start gap-x-2 px-4 py-2.5"
        >
          <LoginSquareIcon className="size-4 text-grey-400" />
          <Typography variant={TYPOGRAPHY.R4}>Switch team</Typography>
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
                <TeamLogo src={""} name={team.name ?? ""} />

                <Typography
                  variant={TYPOGRAPHY.R4}
                  className="min-w-[0px] max-w-[150px] truncate"
                >
                  {team.name}
                </Typography>

                {team.id === props.selectedTeamId && (
                  <CheckmarkCircleIcon className="text-blue-500" />
                )}
              </Link>
            </DropdownItem>
          ))}

          <DropdownItem className="hover:bg-grey-50">
            <div>
              <Button
                href={urls.createTeam()}
                className="grid grid-cols-auto/1fr items-center gap-x-2"
              >
                <AddCircleIcon className="size-4 text-grey-400" /> Create new
                team
              </Button>
            </div>
          </DropdownItem>
        </DropdownItems>
      </Dropdown>
    </div>
  );
};
