"use client";

import { PlusIcon } from "@/components/Icons/PlusIcon";
import { LeaveTeamDialog } from "@/scenes/PortalV3/Profile/Teams/page/LeaveTeamDialog";
import { TransferTeamDialog } from "@/scenes/PortalV3/Profile/Teams/page/TransferTeamDialog";
import { DeleteTeamDialog } from "@/scenes/PortalV3/common/DeleteTeamDialog";
import { InkButton } from "@/scenes/PortalV3/common/InkButton";
import { CREATE_TEAM_DIALOG_URL } from "@/scenes/PortalV3/Profile/page/CreateTeamDialog/dialogRouting";
import { FetchMeQuery } from "@/scenes/common/me-query/client/graphql/client/me-query.generated";
import { useState } from "react";
import { Item } from "./Item";

type Membership = NonNullable<
  FetchMeQuery["user_by_pk"]
>["memberships"][number];
type Team = Membership["team"];

export const List = (props: {
  memberships: Membership[] | undefined;
  loading: boolean;
}) => {
  const [teamForTransfer, setTeamForTransfer] = useState<Team | undefined>();
  const [teamForDelete, setTeamForDelete] = useState<Team | undefined>();
  const [teamForLeave, setTeamForLeave] = useState<Team | undefined>();

  return (
    <>
      <div>
        {props.loading && <Item />}

        {!props.loading &&
          props.memberships?.map((membership) => (
            <Item
              key={membership.team.id}
              item={membership}
              onClickTransfer={() => setTeamForTransfer(membership.team)}
              onClickDelete={() => setTeamForDelete(membership.team)}
              onClickLeave={() => setTeamForLeave(membership.team)}
            />
          ))}
      </div>

      <footer className="flex min-h-14 flex-col gap-3 border-t border-grey-100 bg-grey-25 px-5 py-3 sm:flex-row sm:items-center sm:justify-between md:px-6">
        <p className="font-gta text-13 leading-5 text-grey-400">
          You belong to {props.memberships?.length ?? 0} teams.
        </p>

        <InkButton
          href={CREATE_TEAM_DIALOG_URL}
          className="h-8"
          icon={<PlusIcon className="size-4" />}
        >
          New team
        </InkButton>
      </footer>

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
