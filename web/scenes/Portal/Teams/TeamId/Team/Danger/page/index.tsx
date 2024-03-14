"use client";
import { DecoratedButton } from "@/components/DecoratedButton";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { truncateString } from "@/lib/utils";
import { DeleteTeamDialog } from "@/scenes/Portal/common/DeleteTeamDialog";
import { useParams } from "next/navigation";
import { useState } from "react";
import { TeamProfile } from "../../common/TeamProfile";
import { useFetchTeamQuery } from "../../common/TeamProfile/graphql/client/fetch-team.generated";
import { SizingWrapper } from "@/components/SizingWrapper";

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

      <SizingWrapper gridClassName="order-2">
        <div className="m-auto grid gap-y-8 py-8">
          <div className="grid gap-y-3">
            <Typography as="h1" variant={TYPOGRAPHY.H7}>
              Danger zone
            </Typography>

            <p className="max-w-[36.25rem] text-grey-500">
              This will immediately and permanently delete the team{" "}
              <span className="font-medium text-gray-900">
                {truncateString(fetchTeamQueryRes.data?.team_by_pk?.name, 30)}
              </span>
              , along with all its applications and its data for everyone. This
              cannot be undone.
            </p>
          </div>

          <div>
            <DecoratedButton
              type="submit"
              variant="danger"
              onClick={() => setIsOpenDeleteDialog(true)}
            >
              Delete team
            </DecoratedButton>
          </div>
        </div>
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
