import { useToggle } from "common/hooks";
import { memo } from "react";
import { Controls } from "./Controls";
import { InviteMembersDialog } from "./InviteMembersDialog";
import { RemoveMemberDialog } from "./RemoveMemberDialog";

export const MemberList = memo(function MemberList() {
  const inviteDialog = useToggle();
  const removeDialog = useToggle();

  return (
    <div>
      <InviteMembersDialog
        open={inviteDialog.isOn}
        onClose={inviteDialog.toggleOff}
      />

      <RemoveMemberDialog
        open={removeDialog.isOn}
        onClose={removeDialog.toggleOff}
      />

      <Controls onInviteClick={inviteDialog.toggleOn} />
      <div>MemberList</div>
    </div>
  );
});
