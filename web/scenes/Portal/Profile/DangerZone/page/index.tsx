"use client";

import { DecoratedButton } from "@/components/DecoratedButton";
import { SizingWrapper } from "@/components/SizingWrapper";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { UserInfo } from "@/scenes/Portal/Profile/common/UserInfo";
import { useState } from "react";
import { DeleteAccountDialog } from "../DeleteAccountDialog";

export const DangerZone = () => {
  const [open, setOpen] = useState<boolean>(false);

  return (
    <>
      <div className="pt-9">
        <SizingWrapper className="grid gap-y-8">
          <UserInfo />

          <div className="border-b border-dashed border-grey-200" />
        </SizingWrapper>

        <SizingWrapper className="py-8">
          <div className="grid gap-y-8">
            <div className="grid w-full max-w-[580px] gap-y-3">
              <Typography variant={TYPOGRAPHY.H7} className="text-grey-900">
                Danger zone
              </Typography>

              <Typography variant={TYPOGRAPHY.R3} className="text-grey-500">
                This will immediately and permanently delete your user account
                and will remove your from all your existing teams. This cannot
                be undone.
              </Typography>

              <DecoratedButton
                type="button"
                onClick={() => setOpen(true)}
                variant="danger"
                className="mt-7 max-w-44 py-3"
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
