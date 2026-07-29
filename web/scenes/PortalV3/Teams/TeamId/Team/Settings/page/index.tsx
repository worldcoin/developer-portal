"use client";
import { SizingWrapper } from "@/components/SizingWrapper";
import { Role_Enum } from "@/graphql/graphql";
import { Auth0SessionUser } from "@/lib/types";
import { checkUserPermissions } from "@/lib/utils";
import { FetchTeamDocument } from "@/scenes/common/Teams/TeamId/Team/common/TeamProfile/graphql/client/fetch-team.generated";
import { useUser } from "@auth0/nextjs-auth0/client";
import { useQuery } from "@apollo/client/react";
import { useParams } from "next/navigation";
import { ApiKeys } from "../../sections/ApiKeys";
import { McpSetup } from "../../sections/ApiKeys/McpSetup";
import { TeamDangerZone } from "../../sections/DangerZone";
import { Members } from "../../sections/Members";
import { TeamSettingsForm } from "../../sections/SettingsForm";
import { SettingsBento } from "./SettingsBento";

export const TeamSettingsPage = () => {
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

  // Single team fetch for the whole settings page. The name form and the danger
  // zone read from this instead of each firing their own useFetchTeamQuery.
  const { data, refetch: refetchTeam } = useQuery(FetchTeamDocument, {
    variables: { teamId },
  });
  const team = data?.team_by_pk;

  return (
    <SizingWrapper
      gridClassName="order-1 grow"
      className="mx-auto w-full max-w-[1120px]"
    >
      <div className="flex flex-col gap-5 py-8 pb-28 md:py-10 md:pb-28">
        <TeamSettingsForm
          teamId={teamId}
          teamName={team?.name ?? ""}
          memberCount={team?.memberships.length ?? 0}
          canWrite={canWriteTeamSettings}
          onSaved={refetchTeam}
        />

        <SettingsBento>
          <SettingsBento.Item span={canViewApiKeys ? "wide" : "full"}>
            <Members teamId={teamId} />
          </SettingsBento.Item>

          {canViewApiKeys ? (
            <>
              <SettingsBento.Item span="narrow">
                <ApiKeys teamId={teamId} canWrite={canWriteTeamSettings} />
              </SettingsBento.Item>

              <SettingsBento.Item>
                <McpSetup />
              </SettingsBento.Item>
            </>
          ) : null}
        </SettingsBento>

        {canWriteTeamSettings && team ? (
          <div className="flex justify-end">
            <TeamDangerZone team={{ id: team.id, name: team.name }} />
          </div>
        ) : null}
      </div>
    </SizingWrapper>
  );
};
