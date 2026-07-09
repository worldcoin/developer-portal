"use client";
import { SizingWrapper } from "@/components/SizingWrapper";
import { TeamProfile } from "@/scenes/PortalV3/Teams/TeamId/Team/common/TeamProfile";
import { useFetchTeamQuery } from "@/scenes/common/Teams/TeamId/Team/common/TeamProfile/graphql/client/fetch-team.generated";
import { useParams } from "next/navigation";
import { ApiKeys } from "../../sections/ApiKeys";
import { TeamDangerZone } from "../../sections/DangerZone";
import { Members } from "../../sections/Members";
import { TeamSettingsForm } from "../../sections/SettingsForm";

export const TeamSettingsPage = () => {
  const { teamId } = useParams() as { teamId: string };

  // Single team fetch for the whole settings page. The name form and the danger
  // zone read from this instead of each firing their own useFetchTeamQuery.
  const { data, refetch: refetchTeam } = useFetchTeamQuery({
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
          onSaved={refetchTeam}
        />
        <Members teamId={teamId} />
        <ApiKeys teamId={teamId} />
        <TeamDangerZone team={team ? { id: team.id, name: team.name } : null} />
      </SizingWrapper>
    </>
  );
};
