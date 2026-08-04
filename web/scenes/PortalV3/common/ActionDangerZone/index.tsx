"use client";

import { DestructiveTriggerButton } from "@/components/DestructiveTriggerButton";
import {
  FormDialog,
  formDialogDangerActionClassName,
  formDialogSecondaryActionClassName,
} from "@/components/FormDialog";
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
  compact?: boolean;
};

/** Portal V3 action deletion, kept separate so legacy Portal styling is unchanged. */
export const ActionDangerZone = (props: ActionDangerZoneProps) => {
  const {
    actionIdentifier,
    onDelete,
    isDeleting,
    canDelete,
    className,
    compact = false,
  } = props;
  const [openDeleteModal, setOpenDeleteModal] = useState(false);

  const handleDelete = async () => {
    try {
      await onDelete();
      setOpenDeleteModal(false);
    } catch {
      toast.error("Failed to delete action. Please try again.");
    }
  };

  return (
    <div className={className}>
      <FormDialog
        open={openDeleteModal}
        onClose={() => setOpenDeleteModal(false)}
        dismissable={!isDeleting}
        title="Delete action"
        closeLabel="Close delete action dialog"
      >
        <div className="grid w-full gap-y-6">
          <div className="grid justify-items-center gap-y-4">
            <div className="relative size-[88px]">
              <div className="absolute inset-0 rounded-full bg-danger" />
              <div
                className="absolute inset-0 rounded-full opacity-20"
                style={{
                  background:
                    "radial-gradient(99.88% 100% at 22.73% 0%, #FFFFFF 0%, rgba(255, 255, 255, 0) 100%)",
                }}
              />
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
              <div className="absolute inset-0 flex items-center justify-center text-white">
                <TrashIcon className="size-12" />
              </div>
            </div>

            <p className="text-center font-world text-14 leading-[1.5] text-portal-muted">
              Please be aware that this action is irreversible, and all
              associated data will be permanently lost.
            </p>
          </div>

          <div className="grid w-full gap-3 md:grid-cols-2">
            <button
              type="button"
              className={formDialogSecondaryActionClassName}
              onClick={() => setOpenDeleteModal(false)}
              disabled={isDeleting}
            >
              No
            </button>
            <button
              type="button"
              className={formDialogDangerActionClassName}
              onClick={handleDelete}
              disabled={isDeleting}
            >
              Yes
            </button>
          </div>
        </div>
      </FormDialog>

      <div className={compact ? "flex" : "grid w-full max-w-[480px] gap-y-10"}>
        {!compact ? (
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
        ) : null}

        <DestructiveTriggerButton
          onClick={() => setOpenDeleteModal(true)}
          disabled={isDeleting || !canDelete}
          className="w-fit"
        >
          Delete action
        </DestructiveTriggerButton>
      </div>
    </div>
  );
};
