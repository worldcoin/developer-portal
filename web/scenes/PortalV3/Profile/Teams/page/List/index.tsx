"use client";

import { PlusIcon } from "@/components/Icons/PlusIcon";
import { LeaveTeamDialog } from "@/scenes/PortalV3/Profile/Teams/page/LeaveTeamDialog";
import { TransferTeamDialog } from "@/scenes/PortalV3/Profile/Teams/page/TransferTeamDialog";
import { DeleteTeamDialog } from "@/scenes/PortalV3/common/DeleteTeamDialog";
import { InkButton } from "@/scenes/PortalV3/common/InkButton";
import { PROFILE_CREATE_TEAM_DIALOG_URL } from "@/scenes/Onboarding/CreateTeam/dialogRouting";
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
      <section aria-labelledby="profile-teams-heading">
        <header className="flex h-8 items-center justify-between gap-4">
          <h2
            id="profile-teams-heading"
            className="font-twk text-17 leading-5 font-[550] tracking-[-0.17px] text-portal-ink"
          >
            Your teams
          </h2>

          <InkButton
            href={PROFILE_CREATE_TEAM_DIALOG_URL}
            className="h-8"
            icon={<PlusIcon className="size-4" />}
          >
            New team
          </InkButton>
        </header>

        <div className="mt-2.5 overflow-hidden rounded-[10px] border border-portal-border">
          {props.loading ? (
            <>
              <Item />
              <Item />
            </>
          ) : null}

          {!props.loading && (props.memberships?.length ?? 0) === 0 ? (
            <p className="flex min-h-[69px] items-center px-4 font-world text-13 leading-[1.3] font-[350] text-portal-subtle">
              You don&apos;t belong to any teams yet.
            </p>
          ) : null}

          {!props.loading
            ? props.memberships?.map((membership) => (
                <Item
                  key={membership.team.id}
                  item={membership}
                  onClickTransfer={() => setTeamForTransfer(membership.team)}
                  onClickDelete={() => setTeamForDelete(membership.team)}
                  onClickLeave={() => setTeamForLeave(membership.team)}
                />
              ))
            : null}
        </div>
      </section>

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
