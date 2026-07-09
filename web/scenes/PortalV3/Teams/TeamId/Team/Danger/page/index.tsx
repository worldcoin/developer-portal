"use client";
import { DecoratedButton } from "@/components/DecoratedButton";
import { DeleteTeamDialog } from "@/scenes/PortalV3/common/DeleteTeamDialog";
import { useParams } from "next/navigation";
import { useState } from "react";
import { TeamProfile } from "@/scenes/PortalV3/Teams/TeamId/Team/common/TeamProfile";
import { useFetchTeamQuery } from "@/scenes/common/Teams/TeamId/Team/common/TeamProfile/graphql/client/fetch-team.generated";
import { SizingWrapper } from "@/components/SizingWrapper";
import { Section } from "@/components/Section";
import { truncateString } from "@/lib/utils";

export const TeamDangerZone = (props: { teamId: string }) => {
  const { teamId } = props;
  const fetchTeamQueryRes = useFetchTeamQuery({
    variables: {
      teamId: teamId,
    },
  });

  const [isOpenDeleteDialog, setIsOpenDeleteDialog] = useState(false);

  if (!fetchTeamQueryRes.data) {
    return null;
  }

  return (
    <>
      <Section>
        <Section.Header>
          <Section.Header.Title>Danger zone</Section.Header.Title>
        </Section.Header>

        <div className="grid justify-items-start gap-y-8 max-md:pb-8 md:max-w-[36.25rem]">
          <p className="text-grey-500">
            This will immediately and permanently delete the team{" "}
            <strong className="font-medium text-grey-900">
              {truncateString(fetchTeamQueryRes.data?.team_by_pk?.name, 30)}
            </strong>
            , along with all its applications and its data for everyone. This
            cannot be undone.
          </p>

          <DecoratedButton
            type="submit"
            variant="danger"
            onClick={() => setIsOpenDeleteDialog(true)}
          >
            Delete team
          </DecoratedButton>
        </div>
      </Section>

      <DeleteTeamDialog
        open={isOpenDeleteDialog}
        onClose={() => setIsOpenDeleteDialog(false)}
        team={{
          id: fetchTeamQueryRes.data.team_by_pk?.id,
          name: fetchTeamQueryRes.data.team_by_pk?.name,
        }}
      />
    </>
  );
};

export const TeamDangerPage = () => {
  const { teamId } = useParams() as { teamId: string };

  return (
    <>
      <SizingWrapper gridClassName="order-1">
        <TeamProfile />
      </SizingWrapper>

      <SizingWrapper gridClassName="order-2 grow" className="flex flex-col">
        <TeamDangerZone teamId={teamId} />
      </SizingWrapper>
    </>
  );
};
