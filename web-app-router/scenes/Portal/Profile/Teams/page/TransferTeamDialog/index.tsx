import { Dialog, DialogProps } from "@/components/Dialog";
import { DialogPanel } from "@/components/DialogPanel";
import { DialogOverlay } from "@/components/DialogOverlay";
import { CircleIconContainer } from "@/components/CircleIconContainer";
import { ExchangeIcon } from "@/components/Icons/ExchangeIcon";
import { DecoratedButton } from "@/components/DecoratedButton";
import { TYPOGRAPHY, Typography } from "@/components/Typography";

type TransferTeamDialogProps = DialogProps & {};

export const TransferTeamDialog = (props: TransferTeamDialogProps) => {
  const { ...otherProps } = props;
  return (
    <Dialog {...otherProps}>
      <DialogOverlay />

      <DialogPanel className="w-[36.25rem] grid gap-y-8">
        <CircleIconContainer variant="info">
          <ExchangeIcon />
        </CircleIconContainer>

        <Typography as="h3" variant={TYPOGRAPHY.H6}>
          Transfer ownership
        </Typography>

        <p className="leading-6 font-500 text-16 text-center text-grey-500">
          The <span className="text-grey-900">A11 Team</span> will be deleted,
          along with all of its apps, actions, configurations and statistics.
        </p>

        <div className="grid grid-cols-2 w-full gap-x-4 mt-2">
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
