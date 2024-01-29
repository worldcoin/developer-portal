import { Dialog, DialogProps } from "@/components/Dialog";
import { DialogPanel } from "@/components/DialogPanel";
import { DialogOverlay } from "@/components/DialogOverlay";
import { CircleIconContainer } from "@/components/CircleIconContainer";
import { AlertIcon } from "@/components/Icons/AlertIcon";
import { DecoratedButton } from "@/components/DecoratedButton";
import { TYPOGRAPHY, Typography } from "@/components/Typography";

type DeleteTeamDialogProps = DialogProps & {};

export const DeleteTeamDialog = (props: DeleteTeamDialogProps) => {
  const { ...otherProps } = props;
  return (
    <Dialog {...otherProps}>
      <DialogOverlay />

      <DialogPanel className="w-[28rem] grid gap-y-8">
        <CircleIconContainer variant="error">
          <AlertIcon />
        </CircleIconContainer>

        <div className="grid justify-items-center gap-y-4">
          <Typography as="h3" variant={TYPOGRAPHY.H6}>
            Are you sure?
          </Typography>

          <p className="leading-6 font-500 text-16 text-center text-grey-500">
            The <span className="text-grey-900">A11 Team</span> will be deleted,
            along with all of its apps, actions, configurations and statistics.
          </p>
        </div>

        <div className="grid grid-cols-2 w-full gap-x-4 mt-2">
          <DecoratedButton type="button" variant="danger" className="py-3">
            Delete team
          </DecoratedButton>

          <DecoratedButton
            type="button"
            variant="primary"
            className="py-3"
            onClick={() => props.onClose(false)}
          >
            Keep team
          </DecoratedButton>
        </div>
      </DialogPanel>
    </Dialog>
  );
};
