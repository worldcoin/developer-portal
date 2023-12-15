import { Dialog } from "@/components/Dialog2";
import { memo } from "react";
import { Button } from "@/components/Button2";

export interface RemoveMemberDialogProps {
  open: boolean;
  onClose: () => void;
}

export const DeleteAccountDialog = memo(function DeleteAccountDialog(
  props: RemoveMemberDialogProps
) {
  const { onClose } = props;

  return (
    <Dialog
      open={props.open}
      onClose={props.onClose}
      panelClassName="flex flex-col"
    >
      <div className="leading-7 font-medium text-20 text-gray-900">
        Delete account
      </div>

      <div className="mt-2 leading-5 text-14 text-gray-500">
        Are you really sure you want to delete your account?
      </div>

      <div className="grid grid-cols-2 items-center space-x-3 mt-7">
        <Button variant="contained" onClick={onClose}>
          No
        </Button>

        <Button
          variant="outlined"
          onClick={() => {}} // FIXME: implement account deletion
        >
          Delete account
        </Button>
      </div>
    </Dialog>
  );
});
