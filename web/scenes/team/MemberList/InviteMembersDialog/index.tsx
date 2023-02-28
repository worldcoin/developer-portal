import { Dialog } from "common/Dialog";
import { memo } from "react";
import { getTeamStore, useTeamStore } from "scenes/team/store";

export const InviteMembersDialog = memo(function InviteMembersDialog(props: {
  open: boolean;
  onClose: () => void;
}) {
  const { inviteMembers } = useTeamStore(getTeamStore);

  return (
    <Dialog open={props.open} onClose={props.onClose}>
      <span>Invite Members Dialog</span>

      <button onClick={() => inviteMembers([])}>Invite</button>
    </Dialog>
  );
});
