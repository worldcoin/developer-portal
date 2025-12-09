"use client";

import { CodeFolderIcon } from "@/components/Icons/CodeFolderIcon";
import { HelpSquareIcon } from "@/components/Icons/HelpSquareIcon";
import { LoginSquareIcon } from "@/components/Icons/LoginSquareIcon";
import { TeamLogo } from "@/components/LoggedUserNav/Teams/TeamLogo";
import { useFetchTeamQuery } from "@/components/LoggedUserNav/graphql/client/fetch-team.generated";
import { Role_Enum } from "@/graphql/graphql";
import { DOCS_URL } from "@/lib/constants";
import { Auth0SessionUser } from "@/lib/types";
import { checkUserPermissions } from "@/lib/utils";
import {
  affiliateEnabledAtom,
  isAffiliateEnabledForTeam,
} from "@/scenes/Portal/Teams/TeamId/Team/AffiliateProgram/common/affiliate-enabled-atom";
import { getParameter } from "@/scenes/Portal/Teams/TeamId/Team/AffiliateProgram/common/server/getParameter";
import { colorAtom } from "@/scenes/Portal/layout";
import { useMeQuery } from "@/scenes/common/me-query/client";
import { useUser } from "@auth0/nextjs-auth0/client";
import { useAtom } from "jotai";
import Link from "next/link";
import { useParams } from "next/navigation";
import posthog from "posthog-js";
import { CSSProperties, useCallback, useEffect, useMemo } from "react";
import { Button } from "../Button";
import { Dropdown } from "../Dropdown";
import { LogoutIcon } from "../Icons/LogoutIcon";
import { MailIcon } from "../Icons/MailIcon";
import { SettingsIcon } from "../Icons/SettingsIcon";
import { UserCircleIcon } from "../Icons/UserCircleIcon";
import { UserMultipleIcon } from "../Icons/UserMultipleIcon";
import { TYPOGRAPHY, Typography } from "../Typography";
import { Help } from "./Help";
import { Teams } from "./Teams";

export const LoggedUserNav = () => {
  const [color] = useAtom(colorAtom);
  const { user: auth0User } = useUser() as Auth0SessionUser;
  const [affiliateConfig, setAffiliateConfig] = useAtom(affiliateEnabledAtom);

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
    onCompleted: (data) => {
      console.log("fetched team", data);
      setAffiliateConfig({
        ...affiliateConfig,
        teamVerifiedAppsCount: data.team?.verified_apps.aggregate?.count || 0,
      });
    },
  });

  // First useEffect: Fetch parameters once
  useEffect(() => {
    // Guard: Don't fetch if already fetched or no teamId
    if (affiliateConfig.isFetched) {
      return;
    }

    const fetchParameters = async () => {
      try {
        const isAffiliateProgramEnabled = await getParameter<string>(
          "affiliate-program/enabled",
          "false",
        );
        const enabledTeams = await getParameter<string[]>(
          "affiliate-program/enabled-teams",
          [],
        );

        setAffiliateConfig({
          ...affiliateConfig,
          isFetched: true,
          // Store parameters for future teamId changes
          enabledParameter: isAffiliateProgramEnabled === "true",
          enabledTeamsParameter: enabledTeams ?? [],
        });

        console.log("params", {
          enabledParameter: isAffiliateProgramEnabled === "true",
          enabledTeamsParameter: enabledTeams ?? [],
        });
      } catch (error) {
        console.error(error);
        setAffiliateConfig({ ...affiliateConfig, isFetched: true });
      }
    };

    fetchParameters();
  }, [affiliateConfig, setAffiliateConfig]);

  // useEffect(() => {
  //   const loadVerifiedApp = async () => {
  //     const client = await getAPIServiceGraphqlClient();
  //     const data =  await getSdk(client).GetTeamVerifiedApp({
  //       team_id: teamId
  //     })
  //     if()
  //       data.app.length > 0
  //   }
  //   loadVerifiedApp()
  // }, [teamId]);

  const isAffiliateEnabled = useMemo(
    () =>
      affiliateConfig.isFetched &&
      isAffiliateEnabledForTeam(affiliateConfig, teamId, auth0User),
    [affiliateConfig, teamId, auth0User],
  );

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
        <Dropdown>
          <Dropdown.Button className="grid-cols-1" asChild>
            <div className="flex items-center gap-x-2">
              <Typography variant={TYPOGRAPHY.R4} className="text-grey-500">
                Help
              </Typography>
            </div>
          </Dropdown.Button>

          <Dropdown.List align="end" heading="Help">
            <Help />
          </Dropdown.List>
        </Dropdown>

        <Button href={DOCS_URL} onClick={trackDocsClicked}>
          <Typography variant={TYPOGRAPHY.R4} className="text-grey-500">
            Docs
          </Typography>
        </Button>
      </div>

      <Dropdown>
        <Dropdown.Button
          className="flex size-6 items-center justify-center rounded-full bg-[var(--color-100)] text-xs transition-colors duration-300"
          asChild
        >
          <div>
            <Typography
              variant={TYPOGRAPHY.M5}
              className="text-[var(--color-500)] transition-colors duration-500"
            >
              {nameFirstLetter}
            </Typography>
          </div>
        </Dropdown.Button>

        <Dropdown.List
          className="md:mt-2"
          align="end"
          heading="Settings"
          hideBackButton
        >
          <Dropdown.ListHeader>{user.nameToDisplay}</Dropdown.ListHeader>

          <Dropdown.ListItem asChild>
            <Link href="/profile">
              <Dropdown.ListItemIcon asChild>
                <UserCircleIcon />
              </Dropdown.ListItemIcon>

              <Dropdown.ListItemText>Profile</Dropdown.ListItemText>
            </Link>
          </Dropdown.ListItem>

          <Dropdown.ListSeparator />

          {teamRes.data?.team && (
            <>
              <Dropdown.ListHeader className="grid grid-cols-auto/1fr items-center gap-x-4 md:gap-x-2">
                <TeamLogo
                  className="size-6 text-xs md:size-4"
                  src={""}
                  name={teamRes.data?.team.name ?? ""}
                />
                <div className="truncate">{teamRes.data?.team.name}</div>
              </Dropdown.ListHeader>

              <Dropdown.ListItem asChild>
                <Link href={`/teams/${teamId}`}>
                  <Dropdown.ListItemIcon asChild>
                    <UserMultipleIcon />
                  </Dropdown.ListItemIcon>

                  <Dropdown.ListItemText>Overview</Dropdown.ListItemText>
                </Link>
              </Dropdown.ListItem>

              {hasOwnerPermission && (
                <Dropdown.ListItem asChild>
                  <Link href={`/teams/${teamId}/settings`}>
                    <Dropdown.ListItemIcon asChild>
                      <SettingsIcon />
                    </Dropdown.ListItemIcon>

                    <Dropdown.ListItemText>Settings</Dropdown.ListItemText>
                  </Link>
                </Dropdown.ListItem>
              )}

              {isAffiliateEnabled && (
                <Dropdown.ListItem asChild>
                  <Link href={`/teams/${teamId}/affiliate-program`}>
                    <Dropdown.ListItemIcon asChild>
                      <MailIcon />
                    </Dropdown.ListItemIcon>

                    <Dropdown.ListItemText>
                      Affiliate program
                    </Dropdown.ListItemText>
                  </Link>
                </Dropdown.ListItem>
              )}

              <Dropdown.ListSeparator />
            </>
          )}

          <Dropdown.Sub>
            <Dropdown.SubButton className="text-18 md:text-14">
              <Dropdown.ListItemIcon asChild>
                <LoginSquareIcon />
              </Dropdown.ListItemIcon>

              <Dropdown.ListItemText>Switch team</Dropdown.ListItemText>
            </Dropdown.SubButton>

            <Dropdown.SubList heading="Switch team">
              <Dropdown.ListHeader>Teams</Dropdown.ListHeader>

              <Teams selectedTeamId={teamId} />
            </Dropdown.SubList>
          </Dropdown.Sub>

          <div className="md:hidden">
            <Dropdown.ListHeader>Resources</Dropdown.ListHeader>

            <Dropdown.ListItem asChild>
              <a href={DOCS_URL} onClick={trackDocsClicked}>
                <Dropdown.ListItemIcon asChild>
                  <CodeFolderIcon />
                </Dropdown.ListItemIcon>

                <Dropdown.ListItemText>Docs</Dropdown.ListItemText>
              </a>
            </Dropdown.ListItem>

            <Dropdown.Sub>
              <Dropdown.SubButton>
                <Dropdown.ListItemIcon asChild>
                  <HelpSquareIcon />
                </Dropdown.ListItemIcon>

                <Dropdown.ListItemText>Help</Dropdown.ListItemText>
              </Dropdown.SubButton>

              <Dropdown.SubList heading="Help">
                <Help />
              </Dropdown.SubList>
            </Dropdown.Sub>
          </div>

          <Dropdown.ListSeparator />

          <Dropdown.ListItem asChild>
            <a href="/api/auth/logout" className="text-system-error-600">
              <Dropdown.ListItemIcon className="text-system-error-600" asChild>
                <LogoutIcon />
              </Dropdown.ListItemIcon>

              <Dropdown.ListItemText>Log out</Dropdown.ListItemText>
            </a>
          </Dropdown.ListItem>
        </Dropdown.List>
      </Dropdown>
    </div>
  );
};
