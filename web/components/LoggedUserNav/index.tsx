"use client";

import { TeamSwitch } from "@/components/LoggedUserNav/TeamSwitch";
import { TeamLogo } from "@/components/LoggedUserNav/TeamSwitch/TeamLogo";
import { useFetchTeamQuery } from "@/components/LoggedUserNav/graphql/client/fetch-team.generated";
import { Role_Enum } from "@/graphql/graphql";
import { DOCS_URL } from "@/lib/constants";
import { Auth0SessionUser } from "@/lib/types";
import { checkUserPermissions } from "@/lib/utils";
import { colorAtom } from "@/scenes/Portal/layout";
import { useMeQuery } from "@/scenes/common/me-query/client";
import { useUser } from "@auth0/nextjs-auth0/client";
import { useAtom } from "jotai";
import Link from "next/link";
import { useParams } from "next/navigation";
import posthog from "posthog-js";
import { CSSProperties, Fragment, useCallback, useMemo } from "react";
import { Button } from "../Button";
import { Dropdown } from "../Dropdown";
import { LogoutIcon } from "../Icons/LogoutIcon";
import { SettingsIcon } from "../Icons/SettingsIcon";
import { UserCircleIcon } from "../Icons/UserCircleIcon";
import { UserMultipleIcon } from "../Icons/UserMultipleIcon";
import { TYPOGRAPHY, Typography } from "../Typography";
import { HelpNav } from "./HelpNav";
import { CodeFolderIcon } from "@/components/Icons/CodeFolderIcon";

export const LoggedUserNav = () => {
  const [color] = useAtom(colorAtom);
  const { user: auth0User } = useUser() as Auth0SessionUser;

  const { teamId, appId, actionId } = useParams() as {
    teamId?: string;
    appId?: string;
    actionId?: string;
  };

  const { user } = useMeQuery();

  const hasOwnerPermission = useMemo(() => {
    return checkUserPermissions(auth0User, teamId ?? "", [Role_Enum.Owner]);
  }, [auth0User, teamId]);

  const nameFirstLetter = useMemo(
    () => user.nameToDisplay[0].toLocaleUpperCase(),
    [user.nameToDisplay],
  );

  const trackDocsClicked = useCallback(() => {
    posthog.capture("docs_clicked", {
      teamId: teamId,
      appId: appId,
      actionId: actionId,
      location: "top_nav_bar",
    });
  }, [actionId, appId, teamId]);

  const teamRes = useFetchTeamQuery({
    variables: !teamId
      ? undefined
      : {
          id: teamId,
        },

    skip: !teamId,
  });

  return (
    <div
      className="flex items-center gap-x-3 md:gap-x-5"
      style={
        {
          "--color-100": color?.["100"],
          "--color-500": color?.["500"],
        } as CSSProperties
      }
    >
      <div className="hidden md:contents">
        <HelpNav />

        <Button href={DOCS_URL} onClick={trackDocsClicked}>
          <Typography variant={TYPOGRAPHY.R4} className="text-grey-500">
            Docs
          </Typography>
        </Button>
      </div>

      <Dropdown
        placement="bottom-end"
        //zIndex={60}
      >
        <Dropdown.Button>
          <div className="flex size-6 items-center justify-center rounded-full bg-[var(--color-100)] text-xs transition-colors duration-300">
            <Typography
              variant={TYPOGRAPHY.M5}
              className="text-[var(--color-500)] transition-colors duration-500"
            >
              {nameFirstLetter}
            </Typography>
          </div>
        </Dropdown.Button>

        <Dropdown.Items className="md:mt-2 md:max-w-[200px]">
          <div className="px-2 py-2.5 text-14 leading-5 text-grey-400 md:px-4">
            {user.nameToDisplay}
          </div>

          <Dropdown.Item>
            <Link
              href="/profile"
              className="grid grid-cols-auto/1fr items-center gap-x-4 md:gap-x-2"
            >
              <UserCircleIcon className="size-6 text-grey-400 md:size-4" />
              Profile
            </Link>
          </Dropdown.Item>

          <hr className="my-1 border-grey-200" />

          {teamRes.data?.team && (
            <Fragment>
              <div className="grid w-full grid-cols-auto/1fr items-center gap-x-2 px-2 py-2.5 md:px-4">
                <TeamLogo src={""} name={teamRes.data?.team.name ?? ""} />

                <Typography
                  variant={TYPOGRAPHY.R4}
                  className="max-w-full truncate text-grey-400"
                >
                  {teamRes.data?.team.name}
                </Typography>
              </div>

              <Dropdown.Item>
                <Link
                  href={`/teams/${teamId}`}
                  className="grid grid-cols-auto/1fr items-center gap-x-4 md:gap-x-2"
                >
                  <UserMultipleIcon className="size-6 text-grey-400 md:size-4" />
                  Overview
                </Link>
              </Dropdown.Item>

              {hasOwnerPermission && (
                <Dropdown.Item>
                  <Link
                    href={`/teams/${teamId}/settings`}
                    className="grid grid-cols-auto/1fr items-center gap-x-4 md:gap-x-2"
                  >
                    <SettingsIcon className="size-6 text-grey-400 md:size-4" />
                    Settings
                  </Link>
                </Dropdown.Item>
              )}

              <hr className="my-1 border-grey-200" />
            </Fragment>
          )}

          <Dropdown.Item className="p-0" preventCloseOnClick>
            <TeamSwitch selectedTeamId={teamId} />
          </Dropdown.Item>

          <div className="md:hidden">
            <div className="px-2 py-2.5 text-14 leading-5 text-grey-400">
              Resources
            </div>

            <Dropdown.Item>
              <a
                className="grid grid-cols-auto/1fr items-center gap-x-4"
                href={DOCS_URL}
                onClick={trackDocsClicked}
              >
                <CodeFolderIcon className="text-grey-400" /> Docs
              </a>
            </Dropdown.Item>

            <Dropdown.Item className="p-0" preventCloseOnClick>
              <HelpNav />
            </Dropdown.Item>
          </div>

          <hr className="my-1 border-grey-200" />

          <Dropdown.Item>
            <a
              href="/api/auth/logout"
              className="grid grid-cols-auto/1fr items-center gap-x-4 text-system-error-600 md:gap-x-2"
            >
              <LogoutIcon className="size-6 md:size-4" />
              Log out
            </a>
          </Dropdown.Item>
        </Dropdown.Items>
      </Dropdown>
    </div>
  );
};
