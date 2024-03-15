import { Dropdown } from "components/Dropdown";

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
    skip: !user?.hasura,
    fetchPolicy: "cache-and-network", // NOTE: To make it refetch after create-team
  });

  return (
    <div className="w-full">
      <Dropdown placement="left-start">
        <Dropdown.Button className="grid w-full grid-cols-auto/1fr items-center justify-items-start gap-x-4 px-2 py-2.5 md:gap-x-2 md:px-4">
          <LoginSquareIcon className="size-6 text-grey-400 md:size-4" />
          Switch team
        </Dropdown.Button>

        <Dropdown.Items className="md:relative md:-left-1 md:-top-1">
          <div className="px-2 py-2.5 text-14 leading-5 text-grey-400 md:px-4">
            Teams
          </div>

          {teamsQueryRes.data?.teams.map((team) => (
            <Dropdown.Item key={team.id} className="">
              <Link
                href={`/teams/${team.id}`}
                className="grid grid-cols-auto/1fr/auto items-center gap-x-4 md:gap-x-2"
              >
                <TeamLogo
                  className="size-6 md:size-5"
                  src={""}
                  name={team.name ?? ""}
                />

                <span className="min-w-[0px] truncate md:max-w-[150px]">
                  {team.name}
                </span>

                {team.id === props.selectedTeamId && (
                  <CheckmarkCircleIcon className="size-5 text-blue-500 md:size-4" />
                )}
              </Link>
            </Dropdown.Item>
          ))}

          <Dropdown.Item className="">
            <div>
              <Button
                href={urls.createTeam()}
                className="grid grid-cols-auto/1fr items-center gap-x-4 md:gap-x-2"
              >
                <AddCircleIcon className="size-6 text-grey-400 md:size-4" />{" "}
                Create new team
              </Button>
            </div>
          </Dropdown.Item>
        </Dropdown.Items>
      </Dropdown>
    </div>
  );
};
