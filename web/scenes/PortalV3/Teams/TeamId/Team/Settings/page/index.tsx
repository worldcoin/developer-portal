"use client";
import { SizingWrapper } from "@/components/SizingWrapper";
import { Role_Enum } from "@/graphql/graphql";
import { Auth0SessionUser } from "@/lib/types";
import { checkUserPermissions } from "@/lib/utils";
import { TeamProfile } from "@/scenes/PortalV3/Teams/TeamId/Team/common/TeamProfile";
import { FetchTeamDocument } from "@/scenes/common/Teams/TeamId/Team/common/TeamProfile/graphql/client/fetch-team.generated";
import { useUser } from "@auth0/nextjs-auth0/client";
import { useQuery } from "@apollo/client/react";
import { useParams } from "next/navigation";
import { ApiKeys } from "../../sections/ApiKeys";
import { TeamDangerZone } from "../../sections/DangerZone";
import { Members } from "../../sections/Members";
import { TeamSettingsForm } from "../../sections/SettingsForm";

export const TeamSettingsPage = () => {
  const { teamId } = useParams() as { teamId: string };
  const { user } = useUser() as Auth0SessionUser;

  // Owner-only write access for display name + danger zone. Everyone can open
  // this page (sidebar is ungated); non-owners get a blanked-out read UI.
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
    <>
      <SizingWrapper gridClassName="order-1">
        <TeamProfile />
      </SizingWrapper>

      <SizingWrapper gridClassName="order-2 grow" className="flex flex-col">
        <TeamSettingsForm
          teamId={teamId}
          teamName={team?.name ?? ""}
          canWrite={canWriteTeamSettings}
          onSaved={refetchTeam}
        />
        <Members teamId={teamId} />
        {canViewApiKeys ? (
          <ApiKeys teamId={teamId} canWrite={canWriteTeamSettings} />
        ) : null}
        <TeamDangerZone
          team={team ? { id: team.id, name: team.name } : null}
          canWrite={canWriteTeamSettings}
        />
      </SizingWrapper>
    </>
  );
};
