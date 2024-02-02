"use client";

import { SizingWrapper } from "@/components/SizingWrapper";
import { UserInfo } from "../../layout/UserInfo";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { DecoratedButton } from "@/components/DecoratedButton";
import { Dialog } from "@/components/Dialog";
import { DialogOverlay } from "@/components/DialogOverlay";
import { DialogPanel } from "@/components/DialogPanel";
import { useState } from "react";
import { DeleteAccountDialog } from "../DeleteAccountDialog";

export const DangerZone = () => {
  const [open, setOpen] = useState<boolean>(false);

  return (
    <SizingWrapper className="py-8">
      <div className="grid gap-y-8">
        <UserInfo color="pink" name="Lisa" email="lisa@toolsforhumanity.org" />

        <div className="border-b border-grey-200 border-dashed" />

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
  );
};
