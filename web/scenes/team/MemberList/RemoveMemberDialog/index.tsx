import { Dialog } from "common/Dialog";
import { memo } from "react";
import { getTeamStore, useTeamStore } from "scenes/team/store";

export const RemoveMemberDialog = memo(function RemoveMemberDialog(props: {
  open: boolean;
  onClose: () => void;
}) {
  const { removeMember } = useTeamStore(getTeamStore);

  return (
    <Dialog open={props.open} onClose={props.onClose}>
      <span>Remove member</span>

      <button onClick={() => removeMember("email@domain.com")}>Remove</button>
    </Dialog>
  );
});
