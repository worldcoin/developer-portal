import { Dialog } from "common/Dialog";
import { memo } from "react";

export const InviteMembersDialog = memo(function InviteMembersDialog(props: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <Dialog open={props.open} onClose={props.onClose}>
      Invite Members Dialog
    </Dialog>
  );
});
