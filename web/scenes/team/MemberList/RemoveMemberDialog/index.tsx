import { Dialog } from "common/Dialog";
import { memo } from "react";

export const RemoveMemberDialog = memo(function RemoveMemberDialog(props: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <Dialog open={props.open} onClose={props.onClose}>
      Remove member
    </Dialog>
  );
});
