"use client";

import { DeleteConfirmationDialog } from "@/components/DeleteConfirmationDialog";
import { DestructiveTriggerButton } from "@/components/DestructiveTriggerButton";
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

/**
 * v3 copy of components/ActionDangerZone. It exists so the shared component can
 * keep serving v2 unchanged while v3's confirmation goes through
 * DeleteConfirmationDialog like every other v3 delete.
 */
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
      setOpenDeleteModal(false); // Only close on success
    } catch (error) {
      toast.error("Failed to delete action. Please try again.");
      // Modal stays open for retry
    }
  };

  return (
    <div className={className}>
      <DeleteConfirmationDialog
        open={openDeleteModal}
        onClose={() => setOpenDeleteModal(false)}
        onConfirm={handleDelete}
        confirmationWord="Delete"
        loading={isDeleting}
        title="Delete action"
        description={
          <>
            The{" "}
            <span className="font-medium break-all text-portal-text">
              {actionIdentifier}
            </span>{" "}
            action and all of its data will be deleted for everyone.
          </>
        }
      />

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
