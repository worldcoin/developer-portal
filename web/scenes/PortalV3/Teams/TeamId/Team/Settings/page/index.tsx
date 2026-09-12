"use client";

import { SizingWrapper } from "@/components/SizingWrapper";
import { Role_Enum } from "@/graphql/graphql";
import {
  resolveTeamSettingsTab,
  TEAM_SETTINGS_TABS,
} from "@/lib/team-settings";
import { Auth0SessionUser } from "@/lib/types";
import { checkUserPermissions } from "@/lib/utils";
import { FetchTeamDocument } from "@/scenes/common/Teams/TeamId/Team/common/
TeamProfile/graphql/client/fetch-team.generated";
import { useUser } from "@auth0/nextjs-auth0/client";
import { useQuery } from "@apollo/client/react";
import { useParams } from "next/navigation";
import { ApiKeys } from "../../sections/ApiKeys";
import { McpSetup } from "../../sections/ApiKeys/McpSetup";
import { TeamDangerZone } from "../../sections/DangerZone";
import { LeaveTeam } from "../../sections/LeaveTeam";
import { Members } from "../../sections/Members";
import { TeamSettingsForm } from "../../sections/SettingsForm";

type QueryValue = string | string[] | undefined;

export const TeamSettingsPage = (props: { requestedTab?: QueryValue }) => {
  const { teamId } = useParams() as { teamId: string };
  const { user } = useUser() as Auth0SessionUser;

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
  const activeTab = resolveTeamSettingsTab(props.requestedTab, canViewApiKeys);

  // Only General needs the team record. Members and credentials own their
  // separate queries, so switching tabs does not fetch hidden page sections.
  const { data, refetch: refetchTeam } = useQuery(FetchTeamDocument, {
    variables: { teamId },
    skip: activeTab !== TEAM_SETTINGS_TABS.General,
  });
  const team = data?.team_by_pk;

  if (activeTab === TEAM_SETTINGS_TABS.General) {
    return (
      <div className="w-full px-4 pt-[23px] pb-28 sm:px-6">
        <div className="w-full max-w-[800px]">
          <h1 className="font-world text-19 leading-[1.2] font-[500]
          tracking-[-0.01em] text-portal-ink">
            General
          </h1>

          <section aria-labelledby="team-name-heading" className="mt-10">
            <h2
              id="team-name-heading"
              className="font-world text-15 leading-[1.2] font-[450] text-portal-
              ink"
            >
              Team name
            </h2>

            <div className="mt-4">
              <TeamSettingsForm
                teamId={teamId}
                teamName={team?.name ?? ""}
                canWrite={canWriteTeamSettings}
                onSaved={refetchTeam}
              />
            </div>
          </section>

          <div className="mt-10 border-t border-portal-border" />

          <div className="mt-10">
            <McpSetup />
          </div>

          <div className="mt-10 border-t border-portal-border" />

          {team ? (
            <section aria-labelledby="danger-zone-heading" className="mt-10">
              <h2
                id="danger-zone-heading"
                className="font-world text-17 leading-[1.2] font-[450]
                tracking-[-0.01em] text-portal-ink"
              >
                Danger zone
              </h2>

              <div className="mt-4 flex min-h-[71px] flex-col items-start
              justify-between gap-4 rounded-[10px] border border-portal-border
              p-[15px] sm:flex-row sm:items-center sm:gap-0">
                {canWriteTeamSettings ? (
                  <>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-world text-15 leading-[1.2] font-[450]
                      text-portal-ink">
                        Delete team
                      </h3>
                      <p className="mt-1 font-world text-13 leading-[1.3]
                      font-[350] text-[#7d7d7d]">
                        Permanently delete this team and all of its apps.
                      </p>
                    </div>

                    <TeamDangerZone
                      team={{ id: team.id, name: team.name }}
                    />
                  </>
                ) : (
                  <>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-world text-15 leading-[1.2] font-[450]
                      text-portal-ink">
                        Leave team
                      </h3>
                      <p className="mt-1 font-world text-13 leading-[1.3]
                      font-[350] text-[#7d7d7d]">
                        You will need another invitation to rejoin this team.
                      </p>
                    </div>

                    <LeaveTeam team={{ id: team.id, name: team.name }} />
                  </>
                )}
              </div>
            </section>
          ) : null}
        </div>
      </div>
    );
  }

  if (activeTab === TEAM_SETTINGS_TABS.Members) {
    return <Members teamId={teamId} />;
  }

  return (
    <SizingWrapper
      gridClassName="order-1 grow"
      className="mx-auto w-full max-w-[1120px]"
    >
      <div className="flex flex-col py-8 pb-28 md:py-10 md:pb-28">
        <header className="mb-6">
          <h1 className="font-twk text-24 leading-[1.2] font-[550] text-portal-
          heading">
            Team settings
          </h1>
        </header>

        <div className="grid gap-5">
          {activeTab === TEAM_SETTINGS_TABS.ApiKeys && canViewApiKeys ? (
            <ApiKeys teamId={teamId} canWrite={canWriteTeamSettings} />
          ) : null}
        </div>
      </div>
    </SizingWrapper>
  );
};