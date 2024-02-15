"use client";

import { DOCS_URL } from "@/lib/constants";
import { Auth0SessionUser } from "@/lib/types";
import { colorAtom } from "@/scenes/Portal/layout";
import { useUser } from "@auth0/nextjs-auth0/client";
import { useAtom } from "jotai";
import Link from "next/link";
import { useParams } from "next/navigation";
import posthog from "posthog-js";
import { CSSProperties, Fragment, useCallback } from "react";
import { Button } from "../Button";
import {
  Dropdown,
  DropdownButton,
  DropdownItem,
  DropdownItems,
} from "../Dropdown";
import { LogoutIcon } from "../Icons/LogoutIcon";
import { SettingsIcon } from "../Icons/SettingsIcon";
import { UserCircleIcon } from "../Icons/UserCircleIcon";
import { UserMultipleIcon } from "../Icons/UserMultipleIcon";
import { TYPOGRAPHY, Typography } from "../Typography";
import { HelpNav } from "./HelpNav";
import { TeamSwitch } from "@/components/LoggedUserNav/TeamSwitch";
import { useFetchTeamQuery } from "@/components/LoggedUserNav/graphql/client/fetch-team.generated";
import { TeamLogo } from "@/components/LoggedUserNav/TeamSwitch/TeamLogo";

export const LoggedUserNav = () => {
  const [color] = useAtom(colorAtom);
  const { user } = useUser() as Auth0SessionUser;
  const nameFirstLetter = user?.name?.charAt(0).toUpperCase();
  const { teamId, appId, actionId } = useParams() as {
    teamId?: string;
    appId?: string;
    actionId?: string;
  };

  const trackDocsClicked = useCallback(() => {
    posthog.capture("docs_clicked", {
      teamId: teamId,
      appId: appId,
      actionId: actionId,
      location: "top_nav_bar",
    });
  }, [actionId, appId, teamId]);

  const teamRes = useFetchTeamQuery({
    context: { headers: { team_id: teamId ?? "_" } },
    variables: !teamId
      ? undefined
      : {
          id: teamId,
        },
    skip: !teamId,
  });

  return (
    <div
      className="flex items-center gap-x-5"
      style={
        {
          "--color-100": color?.["100"],
          "--color-500": color?.["500"],
        } as CSSProperties
      }
    >
      <HelpNav />

      <Button href={DOCS_URL} onClick={trackDocsClicked}>
        <Typography variant={TYPOGRAPHY.R4} className="text-grey-500">
          Docs
        </Typography>
      </Button>

      <Dropdown>
        <DropdownButton>
          <div className="flex size-6 items-center justify-center rounded-full bg-[var(--color-100)] text-xs transition-colors duration-300">
            <Typography
              variant={TYPOGRAPHY.M5}
              className="text-[var(--color-500)] transition-colors duration-500"
            >
              {nameFirstLetter}
            </Typography>
          </div>
        </DropdownButton>

        <DropdownItems className="mt-2 max-w-[200px]">
          <Typography
            as="div"
            variant={TYPOGRAPHY.R4}
            className="max-w-full truncate px-4 py-2.5 text-grey-400"
          >
            {user?.email}
          </Typography>

          <DropdownItem>
            <Link
              href="/profile"
              className="grid grid-cols-auto/1fr items-center gap-x-2"
            >
              <UserCircleIcon className="text-grey-400" />
              <Typography variant={TYPOGRAPHY.R4}>Profile</Typography>
            </Link>
          </DropdownItem>

          <hr className="my-1 border-grey-200" />

          {teamRes.data?.team && (
            <Fragment>
              {/* FIXME: create proper team name component */}
              <Typography
                as="div"
                variant={TYPOGRAPHY.R4}
                className="grid max-w-full grid-cols-auto/1fr items-center gap-x-2 truncate px-4 py-2.5 text-grey-400"
              >
                <TeamLogo
                  src={""}
                  name={
                    teamRes.data?.team.name ??
                    "" /*FIXME: team.name must be non nullable*/
                  }
                />

                {teamRes.data?.team.name}
              </Typography>

              <DropdownItem>
                <Link
                  href={`/teams/${teamId}`}
                  className="grid grid-cols-auto/1fr items-center gap-x-2"
                >
                  <UserMultipleIcon className="text-grey-400" />
                  <Typography variant={TYPOGRAPHY.R4}>Overview</Typography>
                </Link>
              </DropdownItem>

              <DropdownItem>
                <Link
                  href={`/teams/${teamId}/settings`}
                  className="grid grid-cols-auto/1fr items-center gap-x-2"
                >
                  <SettingsIcon className="text-grey-400" />
                  <Typography variant={TYPOGRAPHY.R4}>Settings</Typography>
                </Link>
              </DropdownItem>

              <hr className="my-1 border-grey-200" />
            </Fragment>
          )}

          <DropdownItem>
            <div>
              <TeamSwitch selectedTeamId={teamId} />
            </div>
          </DropdownItem>

          <hr className="my-1 border-grey-200" />

          <DropdownItem>
            <a
              href="/api/auth/logout"
              className="grid grid-cols-auto/1fr items-center gap-x-2 text-system-error-600"
            >
              <LogoutIcon className="size-4" />
              <Typography variant={TYPOGRAPHY.R4}>Log out</Typography>
            </a>
          </DropdownItem>
        </DropdownItems>
      </Dropdown>
    </div>
  );
};
