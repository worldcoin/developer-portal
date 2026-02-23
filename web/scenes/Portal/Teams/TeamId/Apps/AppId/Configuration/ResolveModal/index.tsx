import { CircleIconContainer } from "@/components/CircleIconContainer";
import { DecoratedButton } from "@/components/DecoratedButton";
import { Dialog } from "@/components/Dialog";
import { DialogOverlay } from "@/components/DialogOverlay";
import { DialogPanel } from "@/components/DialogPanel";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { CloseIcon } from "@/components/Icons/CloseIcon";

type ResolveModalProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
  reviewMessage?: string | null;
  onResolve?: () => void;
};

export const ResolveModal = ({
  open,
  setOpen,
  reviewMessage,
  onResolve,
}: ResolveModalProps) => {
  const handleResolve = () => {
    if (onResolve) {
      onResolve();
    }
    setOpen(false);
  };

  return (
    <Dialog open={open} onClose={() => setOpen(false)}>
      <DialogOverlay />
      <DialogPanel className="gap-y-6 md:max-w-[36rem]">
        {/* Icon */}
        <CircleIconContainer variant="error">
          <CloseIcon className="size-6 text-grey-400" strokeWidth={2} />
        </CircleIconContainer>

        {/* Content */}
        <div className="grid grid-cols-1 justify-items-center gap-y-4 text-center">
          {/* Title */}
          <Typography variant={TYPOGRAPHY.H6} className="text-grey-900">
            App was rejected
          </Typography>

          {/* Description */}
          <Typography variant={TYPOGRAPHY.R3} className="text-grey-600">
            Unfortunately, your app's review was evaluated by our Worldcoin
            team, and it was rejected due to the reason:
          </Typography>

          {/* Rejection Reason Box */}
          {reviewMessage && (
            <div className="w-full rounded-xl bg-grey-50 px-4 py-3 text-left">
              <Typography variant={TYPOGRAPHY.R4} className="text-grey-700">
                {reviewMessage}
              </Typography>
            </div>
          )}

          {/* Instructions */}
          <Typography variant={TYPOGRAPHY.R3} className="text-grey-600">
            Please, fix the issues stated before and then apply for review
            again.
          </Typography>
        </div>

        {/* Buttons */}
        <div className="grid w-full gap-4 md:grid-cols-2">
          <DecoratedButton
            type="button"
            variant="secondary"
            onClick={() => setOpen(false)}
          >
            Cancel
          </DecoratedButton>
          <DecoratedButton type="button" onClick={handleResolve}>
            Resolve issues
          </DecoratedButton>
        </div>
      </DialogPanel>
    </Dialog>
  );
};
