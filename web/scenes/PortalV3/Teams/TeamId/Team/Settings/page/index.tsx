"use client";
import { SizingWrapper } from "@/components/SizingWrapper";
import { Role_Enum } from "@/graphql/graphql";
import {
  resolveTeamSettingsTab,
  TEAM_SETTINGS_TABS,
} from "@/lib/team-settings";
import { Auth0SessionUser } from "@/lib/types";
import { checkUserPermissions } from "@/lib/utils";
import { FetchTeamDocument } from "@/scenes/common/Teams/TeamId/Team/common/TeamProfile/graphql/client/fetch-team.generated";
import { useUser } from "@auth0/nextjs-auth0/client";
import { useQuery } from "@apollo/client/react";
import { useParams } from "next/navigation";
import { GeneralSettingsLoadingState } from "./LoadingState";
import { SettingsPanel } from "../../common/SettingsPanel";
import { ApiKeys } from "../../sections/ApiKeys";
import { ApiKeysLoadingState } from "../../sections/ApiKeys/LoadingState";
import { McpSetup } from "../../sections/ApiKeys/McpSetup";
import { TeamDangerZone } from "../../sections/DangerZone";
import { LeaveTeam } from "../../sections/LeaveTeam";
import { Members } from "../../sections/Members";
import { TeamSettingsForm } from "../../sections/SettingsForm";

type QueryValue = string | string[] | undefined;

export const TeamSettingsPage = (props: { requestedTab?: QueryValue }) => {
  const { teamId } = useParams() as { teamId: string };
  const { user, isLoading: isUserLoading } = useUser() as Auth0SessionUser & {
    isLoading?: boolean;
  };

  // Owner-only write access for the display name and destructive controls.
  // Everyone can open this page (sidebar is ungated); non-owners get a
  // read-only UI and never receive the delete-team control.
  const canWriteTeamSettings = checkUserPermissions(user, teamId, [
    Role_Enum.Owner,
  ]);
  const canViewApiKeys = checkUserPermissions(user, teamId, [
    Role_Enum.Owner,
    Role_Enum.Admin,
  ]);
  const isResolvingApiKeysAccess =
    props.requestedTab === TEAM_SETTINGS_TABS.ApiKeys && Boolean(isUserLoading);
  const activeTab = resolveTeamSettingsTab(props.requestedTab, canViewApiKeys);

  // Only General needs the team record. Members and credentials own their
  // separate queries, so switching tabs does not fetch hidden page sections.
  const {
    data,
    loading,
    refetch: refetchTeam,
  } = useQuery(FetchTeamDocument, {
    variables: { teamId },
    skip: isResolvingApiKeysAccess || activeTab !== TEAM_SETTINGS_TABS.General,
  });
  const team = data?.team_by_pk;

  if (isResolvingApiKeysAccess) {
    return <ApiKeysLoadingState />;
  }

  if (activeTab === TEAM_SETTINGS_TABS.ApiKeys && canViewApiKeys) {
    return <ApiKeys teamId={teamId} canWrite={canWriteTeamSettings} />;
  }

  if (activeTab === TEAM_SETTINGS_TABS.General && loading && !team) {
    return (
      <GeneralSettingsLoadingState
        canWriteTeamSettings={canWriteTeamSettings}
      />
    );
  }

  return (
    <SizingWrapper
      gridClassName="order-1 grow"
      className="mx-auto w-full max-w-[1120px]"
    >
      <div className="flex flex-col py-8 pb-28 md:py-10 md:pb-28">
        <header className="mb-6">
          <h1 className="font-twk text-24 leading-[1.2] font-[550] text-portal-heading">
            Team settings
          </h1>
        </header>

        <div className="grid gap-5">
          {activeTab === TEAM_SETTINGS_TABS.General ? (
            <>
              <SettingsPanel>
                <SettingsPanel.Header>
                  <SettingsPanel.Title>Team name</SettingsPanel.Title>
                </SettingsPanel.Header>
                <SettingsPanel.Body className="border-t border-grey-100 px-5 py-5">
                  <TeamSettingsForm
                    teamId={teamId}
                    teamName={team?.name ?? ""}
                    canWrite={canWriteTeamSettings}
                    onSaved={refetchTeam}
                  />
                </SettingsPanel.Body>
              </SettingsPanel>

              <McpSetup />

              {team ? (
                <SettingsPanel tone="danger">
                  <SettingsPanel.Header>
                    <SettingsPanel.Title>Danger zone</SettingsPanel.Title>
                  </SettingsPanel.Header>
                  <SettingsPanel.Body className="border-t border-system-error-100">
                    {canWriteTeamSettings ? (
                      <div className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <h3 className="font-world text-13 font-medium text-grey-900">
                            Delete team
                          </h3>
                          <p className="mt-1 font-gta text-13 leading-5 text-grey-400">
                            Permanently delete this team and all of its apps.
                          </p>
                        </div>
                        <TeamDangerZone
                          team={{ id: team.id, name: team.name }}
                        />
                      </div>
                    ) : (
                      <div className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <h3 className="font-world text-13 font-medium text-grey-900">
                            Leave team
                          </h3>
                          <p className="mt-1 font-gta text-13 leading-5 text-grey-400">
                            You will need another invitation to rejoin this
                            team.
                          </p>
                        </div>
                        <LeaveTeam team={{ id: team.id, name: team.name }} />
                      </div>
                    )}
                  </SettingsPanel.Body>
                </SettingsPanel>
              ) : null}
            </>
          ) : null}

          {activeTab === TEAM_SETTINGS_TABS.Members ? (
            <Members teamId={teamId} />
          ) : null}
        </div>
      </div>
    </SizingWrapper>
  );
};
