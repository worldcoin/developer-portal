"use client";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { LeaveTeamDialog } from "@/scenes/Portal/Profile/Teams/page/LeaveTeamDialog";
import { TransferTeamDialog } from "@/scenes/Portal/Profile/Teams/page/TransferTeamDialog";
import { DeleteTeamDialog } from "@/scenes/Portal/common/DeleteTeamDialog";
import { useMeQuery } from "@/scenes/common/me-query/client";
import { FetchMeQuery } from "@/scenes/common/me-query/client/graphql/client/me-query.generated";
import { useState } from "react";
import { Item } from "./Item";

type Team = NonNullable<FetchMeQuery["user_by_pk"]>["memberships"][0]["team"];

export const List = () => {
  const [teamForTransfer, setTeamForTransfer] = useState<Team | undefined>();
  const [teamForDelete, setTeamForDelete] = useState<Team | undefined>();
  const [teamForLeave, setTeamForLeave] = useState<Team | undefined>();

  const { user, loading } = useMeQuery();

  return (
    <>
      <div className="grid md:grid-cols-[auto_60%_1fr_auto] md:items-center">
        <div className="hidden text-12 leading-4 text-grey-400 md:contents">
          <Typography
            variant={TYPOGRAPHY.R5}
            className="col-span-2 border-b border-grey-100 py-3"
          >
            Team
          </Typography>

          <Typography
            variant={TYPOGRAPHY.R5}
            className="col-span-2 border-b border-grey-100 py-3"
          >
            Role
          </Typography>
        </div>

        {loading && <Item />}

        {!loading &&
          user?.memberships?.map((membership) => (
            <Item
              key={membership.team.id}
              item={membership}
              onClickTransfer={() => setTeamForTransfer(membership.team)}
              onClickDelete={() => setTeamForDelete(membership.team)}
              onClickLeave={() => setTeamForLeave(membership.team)}
            />
          ))}
      </div>

      <DeleteTeamDialog
        open={!!teamForDelete}
        onClose={() => setTeamForDelete(undefined)}
        team={{
          id: teamForDelete?.id,
          name: teamForDelete?.name,
        }}
      />

      <LeaveTeamDialog
        team={teamForLeave}
        open={!!teamForLeave}
        onClose={() => setTeamForLeave(undefined)}
      />

      <TransferTeamDialog
        team={teamForTransfer}
        open={!!teamForTransfer}
        onClose={() => setTeamForTransfer(undefined)}
      />
    </>
  );
};
