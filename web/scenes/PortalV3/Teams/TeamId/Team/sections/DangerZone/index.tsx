"use client";
import { DecoratedButton } from "@/components/DecoratedButton";
import { DeleteTeamDialog } from "@/scenes/PortalV3/common/DeleteTeamDialog";
import { useState } from "react";

// The parent owns the permission boundary and only mounts this control for team
// owners. Keeping it as a compact action avoids spending a full bento cell on a
// single destructive operation.
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
      <DecoratedButton
        type="button"
        variant="destructive"
        className="h-8 shrink-0 rounded-8 px-4 py-0 font-world text-13 focus-visible:ring-2 focus-visible:ring-system-error-300 focus-visible:ring-offset-2 focus-visible:outline-hidden"
        onClick={() => setIsOpenDeleteDialog(true)}
      >
        Delete team
      </DecoratedButton>

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
