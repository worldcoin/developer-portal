"use client";

import { SizingWrapper } from "@/components/SizingWrapper";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { DecoratedButton } from "@/components/DecoratedButton";
import { useState } from "react";
import { DeleteAccountDialog } from "../DeleteAccountDialog";
import { UserInfo } from "@/scenes/Portal/Profile/common/UserInfo";

export const DangerZone = () => {
  const [open, setOpen] = useState<boolean>(false);

  return (
    <>
      <div className="pt-9">
        <SizingWrapper className="grid gap-y-8">
          <UserInfo />

          <div className="border-b border-grey-200 border-dashed" />
        </SizingWrapper>

        <SizingWrapper className="py-8">
          <div className="grid gap-y-8">
            <div className="grid gap-y-3 w-full max-w-[580px]">
              <Typography variant={TYPOGRAPHY.H7} className="text-grey-900">
                Danger zone
              </Typography>

              <Typography variant={TYPOGRAPHY.R3} className="text-grey-500">
                This will immediately and permanently delete your user account and
                will remove your from all your existing teams. This cannot be
                undone.
              </Typography>

              <DecoratedButton
                type="button"
                onClick={() => setOpen(true)}
                variant="danger"
                className="py-3 mt-7 max-w-44"
              >
                Delete account
              </DecoratedButton>
            </div>
          </div>

          <DeleteAccountDialog open={open} onClose={setOpen} />
        </SizingWrapper>
      </div>
    </>
  );
};
