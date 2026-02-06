"use client";

import { CircleIconContainer } from "@/components/CircleIconContainer";
import { DecoratedButton } from "@/components/DecoratedButton";
import { Dialog } from "@/components/Dialog";
import { DialogOverlay } from "@/components/DialogOverlay";
import { DialogPanel } from "@/components/DialogPanel";
import { AlertIcon } from "@/components/Icons/AlertIcon";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { truncateString } from "@/lib/utils";
import { useState } from "react";

type ActionDangerZoneProps = {
  actionIdentifier: string;
  onDelete: () => Promise<void>;
  isDeleting: boolean;
  canDelete: boolean;
  className?: string;
};

export const ActionDangerZone = (props: ActionDangerZoneProps) => {
  const { actionIdentifier, onDelete, isDeleting, canDelete, className } =
    props;
  const [openDeleteModal, setOpenDeleteModal] = useState(false);

  const handleDelete = async () => {
    await onDelete();
    setOpenDeleteModal(false);
  };

  return (
    <div className={className}>
      <Dialog open={openDeleteModal} onClose={() => setOpenDeleteModal(false)}>
        <DialogOverlay />

        <DialogPanel className="grid gap-y-6 md:max-w-[26rem]">
          <CircleIconContainer variant={"error"}>
            <AlertIcon />
          </CircleIconContainer>

          <div className="grid w-full place-items-center gap-y-5 px-2">
            <Typography variant={TYPOGRAPHY.H6} className="text-grey-900">
              Are you sure?
            </Typography>

            <Typography
              variant={TYPOGRAPHY.R3}
              className="text-center text-grey-500"
            >
              Are you sure you want to proceed with deleting this action? Please
              be aware that this action is irreversible, and all associated data
              will be permanently lost.
            </Typography>
          </div>

          <div className="grid w-full gap-4 md:grid-cols-2">
            <DecoratedButton
              type="button"
              variant="danger"
              className="order-2 w-full bg-system-error-100 py-3 md:order-1"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              <Typography variant={TYPOGRAPHY.R3}>Delete Action</Typography>
            </DecoratedButton>

            <DecoratedButton
              type="button"
              className="order-1 w-full py-3 md:order-2"
              onClick={() => setOpenDeleteModal(false)}
            >
              <Typography variant={TYPOGRAPHY.R3}>Keep Action</Typography>
            </DecoratedButton>
          </div>
        </DialogPanel>
      </Dialog>

      <div className="grid w-full grid-cols-1 gap-y-10 md:grid-cols-1fr/auto">
        <div className="grid max-w-[480px] gap-y-10">
          <div className="grid gap-y-2">
            <Typography variant={TYPOGRAPHY.H7} className="text-grey-900">
              Danger Zone
            </Typography>

            <Typography variant={TYPOGRAPHY.R3} className="text-grey-500">
              This will immediately and permanently delete the action{" "}
              <Typography variant={TYPOGRAPHY.M3} className="text-grey-900">
                {truncateString(actionIdentifier, 30)}
              </Typography>{" "}
              and its data for everyone. This cannot be undone.
            </Typography>
          </div>

          <DecoratedButton
            type="button"
            variant="danger"
            onClick={() => setOpenDeleteModal(true)}
            disabled={isDeleting || !canDelete}
            className="w-40 bg-system-error-100"
          >
            <Typography variant={TYPOGRAPHY.R3}>Delete action</Typography>
          </DecoratedButton>
        </div>
      </div>
    </div>
  );
};
