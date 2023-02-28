import { useToggle } from "common/hooks";
import { memo } from "react";
import { Controls } from "./Controls";
import { InviteMembersDialog } from "./InviteMembersDialog";

export const MemberList = memo(function MemberList() {
  const inviteModal = useToggle();

  return (
    <div>
      <Controls onInviteClick={inviteModal.toggleOn} />

      <InviteMembersDialog
        open={inviteModal.isOn}
        onClose={inviteModal.toggleOff}
      />

      <div>MemberList</div>
    </div>
  );
});
