"use client";
import { DecoratedButton } from "@/components/DecoratedButton";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { DeleteTeamDialog } from "@/scenes/Portal/Teams/TeamId/Team/Danger/page/DeleteTeamDialog";
import { useParams } from "next/navigation";
import { useState } from "react";
import { TeamProfile } from "../../common/TeamProfile";
import { useFetchTeamQuery } from "../../common/TeamProfile/graphql/client/fetch-team.generated";

export const TeamDangerPage = () => {
  const { teamId } = useParams() as { teamId: string };
  const fetchTeamQueryRes = useFetchTeamQuery({
    context: { headers: { team_id: teamId } },
    variables: {
      teamId: teamId,
    },
  });

  const [isOpenDeleteDialog, setIsOpenDeleteDialog] = useState(false);

  if (!fetchTeamQueryRes.data) {
    return null;
  }

  return (
    <div>
      <TeamProfile />

      <div className="m-auto grid gap-y-8 py-8">
        <div className="grid gap-y-3">
          <Typography as="h1" variant={TYPOGRAPHY.H7}>
            Danger zone
          </Typography>

          <p className="max-w-[36.25rem] text-grey-500">
            This will immediately and permanently delete the{" "}
            <span className="font-medium text-gray-900">
              {fetchTeamQueryRes.data.team_by_pk?.name}
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

      <DeleteTeamDialog
        team={fetchTeamQueryRes.data.team_by_pk}
        open={isOpenDeleteDialog}
        onClose={() => setIsOpenDeleteDialog(false)}
      />
    </div>
  );
};
