"use client";
import { DecoratedButton } from "@/components/DecoratedButton";
import { DeleteTeamDialog } from "@/scenes/Portal/common/DeleteTeamDialog";
import { useParams } from "next/navigation";
import { useState } from "react";
import { TeamProfile } from "../../common/TeamProfile";
import { useFetchTeamQuery } from "../../common/TeamProfile/graphql/client/fetch-team.generated";
import { SizingWrapper } from "@/components/SizingWrapper";
import { Section } from "@/components/Section";

export const TeamDangerPage = () => {
  const { teamId } = useParams() as { teamId: string };
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
      <SizingWrapper gridClassName="order-1">
        <TeamProfile />
      </SizingWrapper>

      <SizingWrapper gridClassName="order-2 grow" className="flex flex-col">
        <Section>
          <Section.Header>
            <Section.Header.Title>Danger zone</Section.Header.Title>
          </Section.Header>

          <div className="grid justify-items-start gap-y-8 max-md:pb-8 md:max-w-[36.25rem]">
            <p className="text-grey-500">
              This will immediately and permanently delete the team <strong className="font-medium text-grey-900">{fetchTeamQueryRes.data?.team_by_pk?.name}</strong>, along with all its applications and its data for everyone. This cannot be undone.
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
      </SizingWrapper>

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
