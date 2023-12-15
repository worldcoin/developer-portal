import { Button } from "@/components/Button2";
import { Dialog } from "@/components/Dialog2";
import { memo, useCallback } from "react";
import {
  Team,
  TeamMember,
  useDeleteTeamMember,
} from "@/scenes/team/hooks/useTeam";

export interface RemoveMemberDialogProps {
  team: Team;
  memberForRemove?: TeamMember;
  onClose: () => void;
}

export const RemoveMemberDialog = memo(function RemoveMemberDialog(
  props: RemoveMemberDialogProps
) {
  const { team } = props;

  const { memberForRemove, onClose } = props;
  const { deleteTeamMember, loading } = useDeleteTeamMember();

  const handleConfirm = useCallback(async () => {
    if (!memberForRemove) return;
    await deleteTeamMember(memberForRemove.id);
    onClose();
  }, [deleteTeamMember, memberForRemove, onClose]);

  return (
    <Dialog
      open={!!memberForRemove}
      onClose={onClose}
      panelClassName="flex flex-col space-y-8"
    >
      <div className="leading-7 font-medium text-20 text-gray-900">
        Remove member
      </div>

      <div className="mt-2 leading-5 text-14 text-gray-500">
        Do you really want to remove an {team.name} team member? Remember, this
        action is permanent.
      </div>

      <div className="grid grid-cols-2 items-center space-x-3 mt-7">
        <Button variant="contained" onClick={onClose}>
          No
        </Button>

        <Button variant="outlined" onClick={handleConfirm} disabled={loading}>
          Yes, remove
        </Button>
      </div>
    </Dialog>
  );
});
