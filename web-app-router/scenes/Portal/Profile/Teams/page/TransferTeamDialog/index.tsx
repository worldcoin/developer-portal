import { Dialog, DialogProps } from "@/components/Dialog";
import { DialogPanel } from "@/components/DialogPanel";
import { DialogOverlay } from "@/components/DialogOverlay";
import { AlertIcon } from "@/components/Icons/AlertIcon";
import { CircleIconContainer } from "@/components/CircleIconContainer";
import { ExchangeIcon } from "@/components/Icons/ExchangeIcon";
import { DecoratedButton } from "@/components/DecoratedButton";

type TransferTeamDialogProps = DialogProps & {};

export const TransferTeamDialog = (props: TransferTeamDialogProps) => {
  const { ...otherProps } = props;
  return (
    <Dialog {...otherProps}>
      <DialogOverlay />

      <DialogPanel className="w-[36.25rem]">
        <CircleIconContainer variant="info">
          <ExchangeIcon />
        </CircleIconContainer>

        <h3 className="mt-8 leading-8 font-550 text-24">Transfer ownership</h3>

        <p className="mt-4 leading-6 font-500 text-16 text-center text-grey-500">
          The <span className="text-grey-900">A11 Team</span> will be deleted,
          along with all of its apps, actions, configurations and statistics.
        </p>

        <div className="grid grid-cols-2 w-full gap-x-4 mt-10">
          <DecoratedButton
            type="button"
            variant="secondary"
            onClick={() => props.onClose(false)}
          >
            Cancel
          </DecoratedButton>
          <DecoratedButton type="button" variant="primary">
            Transfer ownership
          </DecoratedButton>
        </div>
      </DialogPanel>
    </Dialog>
  );
};
