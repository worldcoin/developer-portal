"use client";

import { List } from "@/scenes/Portal/Profile/Teams/page/List";
import { DecoratedButton } from "@/components/DecoratedButton";
import { CreateTeamDialog } from "@/scenes/Portal/Profile/Teams/page/CreateTeamDIalog";
import { useState } from "react";
import { SizingWrapper } from "@/components/SizingWrapper";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { UserInfo } from "@/scenes/Portal/Profile/common/UserInfo";

export const TeamsPage = () => {
  const [isOpenCreateTeamDialog, setIsOpenCreateTeamDialog] =
    useState<boolean>(false);

  return (
    <>
      <div className="pt-9">
        <SizingWrapper className="grid gap-y-8">
          <UserInfo />

          <div className="border-b border-dashed border-grey-200" />
        </SizingWrapper>
      </div>

      <SizingWrapper>
        <div className="m-auto grid gap-y-8 py-8">
          <div className="grid grid-cols-[1fr_auto]">
            <Typography as="h1" variant={TYPOGRAPHY.H7}>
              Teams
            </Typography>

            <DecoratedButton
              type="button"
              variant="primary"
              onClick={() => setIsOpenCreateTeamDialog(true)}
              className="py-3"
            >
              Create new team
            </DecoratedButton>
          </div>

          <List />
        </div>

        <CreateTeamDialog
          open={isOpenCreateTeamDialog}
          onClose={setIsOpenCreateTeamDialog}
        />
      </SizingWrapper>
    </>
  );
};
