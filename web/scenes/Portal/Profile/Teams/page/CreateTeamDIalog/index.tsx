import { Dialog, DialogProps } from "@/components/Dialog";
import { DialogOverlay } from "@/components/DialogOverlay";
import { DialogPanel } from "@/components/DialogPanel";

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
