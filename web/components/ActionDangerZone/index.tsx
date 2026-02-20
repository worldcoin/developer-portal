"use client";

import { DecoratedButton } from "@/components/DecoratedButton";
import { Dialog } from "@/components/Dialog";
import { DialogOverlay } from "@/components/DialogOverlay";
import { DialogPanel } from "@/components/DialogPanel";
import { TrashIcon } from "@/components/Icons/TrashIcon";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { truncateString } from "@/lib/utils";
import { useState } from "react";
import { toast } from "react-toastify";

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
    try {
      await onDelete();
      setOpenDeleteModal(false); // Only close on success
    } catch (error) {
      toast.error("Failed to delete action. Please try again.");
      // Modal stays open for retry
    }
  };

  return (
    <div className={className}>
      <Dialog open={openDeleteModal} onClose={() => setOpenDeleteModal(false)}>
        <DialogOverlay />

        <DialogPanel className="grid gap-y-10 p-8 md:max-w-[580px]">
          {/* Content wrapper - icon and text with 32px gap */}
          <div className="grid justify-items-center gap-y-8">
            {/* Custom red circle icon with trash */}
            <div className="relative size-[88px]">
              {/* Base circle */}
              <div className="absolute inset-0 rounded-full bg-danger" />

              {/* Radial gradient overlay */}
              <div
                className="absolute inset-0 rounded-full opacity-20"
                style={{
                  background:
                    "radial-gradient(99.88% 100% at 22.73% 0%, #FFFFFF 0%, rgba(255, 255, 255, 0) 100%)",
                }}
              />

              {/* Gradient border */}
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  background:
                    "linear-gradient(180deg, rgba(255, 255, 255, 0.3) 0%, rgba(255, 255, 255, 0) 100%)",
                  WebkitMask:
                    "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                  WebkitMaskComposite: "xor",
                  maskComposite: "exclude",
                  padding: "0.5px",
                }}
              />

              {/* Trash icon */}
              <div className="absolute inset-0 flex items-center justify-center text-white">
                <TrashIcon className="size-12" />
              </div>
            </div>

            {/* Copy section */}
            <div className="grid w-full place-items-center gap-y-2 px-2">
              <Typography
                as="h3"
                className="text-center text-[26px] font-semibold leading-[1.2] tracking-[-0.01em] text-grey-900"
              >
                Do you want to remove
                <br />
                this action?
              </Typography>

              <Typography
                variant={TYPOGRAPHY.B3}
                className="text-center text-[15px] leading-[1.3] text-grey-500"
              >
                Please be aware that this action is irreversible, and all
                associated data will be permanently lost.
              </Typography>
            </div>
          </div>

          {/* Button section */}
          <div className="grid w-full gap-4 md:grid-cols-2">
            <DecoratedButton
              type="button"
              className="h-14 w-full rounded-full border border-grey-200 bg-white hover:bg-grey-50"
              onClick={() => setOpenDeleteModal(false)}
            >
              <Typography
                variant={TYPOGRAPHY.R3}
                className="font-world text-[17px] font-semibold leading-[1.2] text-grey-900"
              >
                No
              </Typography>
            </DecoratedButton>

            <DecoratedButton
              type="button"
              variant="danger"
              className="h-14 w-full rounded-full bg-danger hover:bg-system-error-700"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              <Typography
                variant={TYPOGRAPHY.R3}
                className="font-world text-[17px] font-semibold leading-[1.2] text-white"
              >
                Yes
              </Typography>
            </DecoratedButton>
          </div>
        </DialogPanel>
      </Dialog>

      <div className="grid w-full max-w-[480px] gap-y-10">
        <div className="grid gap-y-2">
          <Typography variant={TYPOGRAPHY.H7} className="text-grey-900">
            Danger zone
          </Typography>

          <Typography variant={TYPOGRAPHY.R3} className="text-grey-500">
            This will immediately and permanently delete the{" "}
            <Typography variant={TYPOGRAPHY.M3} className="text-grey-900">
              {truncateString(actionIdentifier, 30)}
            </Typography>{" "}
            action and its data for everyone. This cannot be undone.
          </Typography>
        </div>

        <DecoratedButton
          type="button"
          variant="danger"
          onClick={() => setOpenDeleteModal(true)}
          disabled={isDeleting || !canDelete}
          className="h-14 w-fit rounded-full bg-danger px-6 hover:bg-system-error-700"
        >
          <Typography variant={TYPOGRAPHY.R3} className="text-white">
            Delete action
          </Typography>
        </DecoratedButton>
      </div>
    </div>
  );
};
