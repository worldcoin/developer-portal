import { CircleIconContainer } from "@/components/CircleIconContainer";
import { DecoratedButton } from "@/components/DecoratedButton";
import { Dialog, DialogProps } from "@/components/Dialog";
import { DialogOverlay } from "@/components/DialogOverlay";
import { DialogPanel } from "@/components/DialogPanel";
import { AlertIcon } from "@/components/Icons/AlertIcon";
import { TYPOGRAPHY, Typography } from "@/components/Typography";

type DeleteTeamDialogProps = DialogProps & {};

export const DeleteTeamDialog = (props: DeleteTeamDialogProps) => {
  const { ...otherProps } = props;
  return (
    <Dialog {...otherProps}>
      <DialogOverlay />

      <DialogPanel className="grid w-[28rem] gap-y-8">
        <CircleIconContainer variant="error">
          <AlertIcon />
        </CircleIconContainer>

        <div className="grid justify-items-center gap-y-4">
          <Typography as="h3" variant={TYPOGRAPHY.H6}>
            Are you sure?
          </Typography>

          <p className="text-center text-16 font-medium leading-6 text-grey-500">
            The <span className="text-grey-900">A11 Team</span> will be deleted,
            along with all of its apps, actions, configurations and statistics.
          </p>
        </div>

        <div className="mt-2 grid w-full grid-cols-2 gap-x-4">
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
