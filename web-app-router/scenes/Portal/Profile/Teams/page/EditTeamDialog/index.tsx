import { Dialog, DialogProps } from "@/components/Dialog";
import { DialogPanel } from "@/components/DialogPanel";
import { DialogOverlay } from "@/components/DialogOverlay";

type EditTeamDialogProps = DialogProps & {};

export const EditTeamDialog = (props: EditTeamDialogProps) => {
  const { ...otherProps } = props;
  return (
    <Dialog {...otherProps}>
      <DialogOverlay />

      <DialogPanel>coming soon</DialogPanel>
    </Dialog>
  );
};
