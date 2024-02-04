import { Dialog, DialogProps } from "@/components/Dialog";
import { DialogPanel } from "@/components/DialogPanel";
import { DialogOverlay } from "@/components/DialogOverlay";
import { AlertIcon } from "@/components/Icons/AlertIcon";
import { CircleIconContainer } from "@/components/CircleIconContainer";
import { DecoratedButton } from "@/components/DecoratedButton";
import { Typography, TYPOGRAPHY } from "@/components/Typography";

type LeaveTeamDialogProps = DialogProps & {};

export const LeaveTeamDialog = (props: LeaveTeamDialogProps) => {
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
            If you choose to leave the{" "}
            <span className="text-grey-900">Tools for Humanity</span> team, you
            will need to be invited again in order to rejoin if you change your
            mind.
          </p>
        </div>

        <div className="grid grid-cols-2 w-full gap-x-4 mt-2">
          <DecoratedButton type="button" variant="danger">
            Leave team
          </DecoratedButton>

          <DecoratedButton
            type="button"
            variant="primary"
            onClick={() => props.onClose(false)}
          >
            Stay in team
          </DecoratedButton>
        </div>
      </DialogPanel>
    </Dialog>
  );
};
