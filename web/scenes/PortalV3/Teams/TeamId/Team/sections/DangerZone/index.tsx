"use client";
import { DestructiveTriggerButton } from "@/components/DestructiveTriggerButton";
import { DeleteTeamDialog } from "@/scenes/PortalV3/common/DeleteTeamDialog";
import { useState } from "react";

// The parent owns the permission boundary and only mounts this control for team
// owners. Keeping it as a compact action avoids spending a full settings panel
// on a single destructive operation.
export const TeamDangerZone = (props: {
  team: { id?: string | null; name?: string | null } | null;
}) => {
  const { team } = props;
  const [isOpenDeleteDialog, setIsOpenDeleteDialog] = useState(false);

  if (!team) {
    return null;
  }

  return (
    <>
      <DestructiveTriggerButton
        className="shrink-0"
        onClick={() => setIsOpenDeleteDialog(true)}
      >
        Delete team
      </DestructiveTriggerButton>

      <DeleteTeamDialog
        open={isOpenDeleteDialog}
        onClose={() => setIsOpenDeleteDialog(false)}
        team={{
          id: team.id,
          name: team.name,
        }}
      />
    </>
  );
};
