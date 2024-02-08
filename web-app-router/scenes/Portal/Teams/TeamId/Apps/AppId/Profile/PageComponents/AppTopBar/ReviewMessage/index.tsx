import { CircleIconContainer } from "@/components/CircleIconContainer";
import { DecoratedButton } from "@/components/DecoratedButton";
import { Dialog } from "@/components/Dialog";
import { DialogOverlay } from "@/components/DialogOverlay";
import { DialogPanel } from "@/components/DialogPanel";
import { CloseIcon } from "@/components/Icons/CloseIcon";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { useCallback } from "react";

export const ReviewMessage = (props: {
  message: string;
  open: boolean;
  closeModal: () => void;
  removeFromReview: () => void;
}) => {
  const { message, open, closeModal, removeFromReview } = props;

  const removeAndClose = useCallback(() => {
    removeFromReview();
    closeModal();
  }, [removeFromReview, closeModal]);

  return (
    <Dialog onClose={closeModal} open={open}>
      <DialogOverlay />
      <DialogPanel className="max-w-[500px] grid gap-y-8">
        <CircleIconContainer variant={"error"}>
          <CloseIcon
            className="h-5 w-5 text-system-error-600"
            strokeWidth={3}
          />
        </CircleIconContainer>
        <div className="grid gap-y-4 w-full items-center justify-center">
          <Typography
            variant={TYPOGRAPHY.H6}
            className="text-grey-900 text-center"
          >
            App was rejected
          </Typography>
          <Typography
            variant={TYPOGRAPHY.R3}
            className="text-grey-500 text-center "
          >
            Unfortunately, your app was evaluated by our team, and it was
            rejected for the following reason
          </Typography>
        </div>
        <div className="border border-grey-200 rounded-lg px-5 py-4 bg-grey-25 w-full">
          <Typography variant={TYPOGRAPHY.R3} className="text-grey-400">
            {message}
          </Typography>
        </div>
        <div className="grid grid-cols-2 w-full gap-x-4">
          <DecoratedButton
            type="submit"
            variant="secondary"
            onClick={closeModal}
          >
            Cancel
          </DecoratedButton>
          <DecoratedButton onClick={removeAndClose} type="submit">
            Resolve issues
          </DecoratedButton>
        </div>
      </DialogPanel>
    </Dialog>
  );
};
