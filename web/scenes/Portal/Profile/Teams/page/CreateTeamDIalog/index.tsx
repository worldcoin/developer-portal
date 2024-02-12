import { Dialog, DialogProps } from "@/components/Dialog";
import { DialogPanel } from "@/components/DialogPanel";
import { DialogOverlay } from "@/components/DialogOverlay";

type CreateTeamDialogProps = DialogProps & {};

export const CreateTeamDialog = (props: CreateTeamDialogProps) => {
  const { ...otherProps } = props;
  return (
    <Dialog {...otherProps}>
      <DialogOverlay />

      <DialogPanel>coming soon</DialogPanel>
    </Dialog>
  );
};
