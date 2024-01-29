import { Dialog, DialogProps } from "@/components/Dialog";
import { DialogPanel } from "@/components/DialogPanel";
import { DialogOverlay } from "@/components/DialogOverlay";
import { CircleIconContainer } from "@/components/CircleIconContainer";
import { AlertIcon } from "@/components/Icons/AlertIcon";
import { DecoratedButton } from "@/components/DecoratedButton";

type DeleteTeamDialogProps = DialogProps & {};

export const DeleteTeamDialog = (props: DeleteTeamDialogProps) => {
  const { ...otherProps } = props;
  return (
    <Dialog {...otherProps}>
      <DialogOverlay />

      <DialogPanel className="w-[28rem]">
        <CircleIconContainer variant="error">
          <AlertIcon />
        </CircleIconContainer>

        <h3 className="mt-8 leading-8 font-550 text-24">Are you sure?</h3>

        <p className="mt-4 leading-6 font-500 text-16 text-center text-grey-500">
          The <span className="text-grey-900">A11 Team</span> will be deleted,
          along with all of its apps, actions, configurations and statistics.
        </p>

        <div className="grid grid-cols-2 w-full gap-x-4 mt-10">
          <DecoratedButton type="button" variant="danger">
            Delete team
          </DecoratedButton>
          <DecoratedButton
            type="button"
            variant="primary"
            onClick={() => props.onClose(false)}
          >
            Keep team
          </DecoratedButton>
        </div>
      </DialogPanel>
    </Dialog>
  );
};
