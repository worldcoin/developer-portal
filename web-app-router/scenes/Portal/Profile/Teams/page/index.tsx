"use client";
import { UserInfo } from "@/scenes/Portal/Profile/layout/UserInfo";
import { List } from "@/scenes/Portal/Profile/Teams/page/List";
import { DecoratedButton } from "@/components/DecoratedButton";
import { CreateTeamDialog } from "@/scenes/Portal/Profile/Teams/page/CreateTeamDIalog";
import { useState } from "react";

export const TeamsPage = () => {
  const [isOpenCreateTeamDialog, setIsOpenCreateTeamDialog] =
    useState<boolean>(false);

  return (
    <>
      <div className="grid gap-y-8 max-w-[1180px] m-auto py-8">
        <UserInfo color="pink" name="Lisa" email="lisa@toolsforhumanity.org" />

        <div className="border-b border-grey-200 border-dashed" />

        <div>
          <div className="grid grid-cols-[1fr_auto]">
            <h1 className="leading-6 font-550 text-18">Teams</h1>

            <DecoratedButton
              type="button"
              variant="primary"
              onClick={() => setIsOpenCreateTeamDialog(true)}
            >
              Create new team
            </DecoratedButton>
          </div>

          <List />
        </div>
      </div>

      <CreateTeamDialog
        open={isOpenCreateTeamDialog}
        onClose={setIsOpenCreateTeamDialog}
      />
    </>
  );
};
