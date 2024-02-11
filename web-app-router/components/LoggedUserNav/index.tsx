"use client";

import { useUser } from "@auth0/nextjs-auth0/client";
import { Button } from "../Button";
import {
  Dropdown,
  DropdownButton,
  DropdownItem,
  DropdownItems,
} from "../Dropdown";
import { LogoutIcon } from "../Icons/LogoutIcon";
import { TYPOGRAPHY, Typography } from "../Typography";
import { Auth0SessionUser } from "@/lib/types";
import { UserCircleIcon } from "../Icons/UserCircleIcon";
import { DOCS_URL } from "@/lib/constants";
import Link from "next/link";
import { CSSProperties, Fragment, useCallback } from "react";
import { colorAtom } from "@/scenes/Portal/layout";
import { useAtom } from "jotai";
import { useParams } from "next/navigation";
import { UserMultipleIcon } from "../Icons/UserMultipleIcon";
import { SettingsIcon } from "../Icons/SettingsIcon";
import { HelpNav } from "./HelpNav";
import posthog from "posthog-js";

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
          <div className="h-6 w-6 text-xs flex justify-center items-center bg-[var(--color-100)] rounded-full transition-colors duration-300">
            <Typography
              variant={TYPOGRAPHY.M5}
              className="text-[var(--color-500)] transition-colors duration-500"
            >
              {nameFirstLetter}
            </Typography>
          </div>
        </DropdownButton>

        <DropdownItems className="max-w-[200px] mt-2">
          <Typography
            as="div"
            variant={TYPOGRAPHY.R4}
            className="truncate max-w-full px-4 py-2.5 text-grey-400"
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

          <hr className="border-grey-200" />

          {teamId && (
            <Fragment>
              <hr className="border-grey-200" />

              {/* FIXME: create proper team name component */}
              <Typography
                as="div"
                variant={TYPOGRAPHY.R4}
                className="truncate max-w-full px-4 py-2.5 text-grey-400"
              >
                {teamId}
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

              <hr className="border-grey-200" />
            </Fragment>
          )}

          <DropdownItem>
            <a
              href="/api/auth/logout"
              className="grid grid-cols-auto/1fr items-center gap-x-2 text-system-error-600"
            >
              <LogoutIcon className="w-4 h-4" />
              <Typography variant={TYPOGRAPHY.R4}>Log out</Typography>
            </a>
          </DropdownItem>
        </DropdownItems>
      </Dropdown>
    </div>
  );
};
