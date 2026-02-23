import { ModalIcon } from "@/components/ModalIcon";
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
        <ModalIcon variant="neutral">
          <CloseIcon className="size-8 text-white" strokeWidth={2} />
        </ModalIcon>

        {/* Content */}
        <div className="grid grid-cols-1 justify-items-center gap-y-6 text-center">
          {/* Title + Description */}
          <div className="grid gap-y-2">
            <Typography variant={TYPOGRAPHY.H6} className="text-grey-900">
              App was rejected
            </Typography>
            <Typography variant={TYPOGRAPHY.R4} className="text-grey-500">
              Unfortunately, your app's review was evaluated by our Worldcoin
              team, and it was rejected due to the reason:
            </Typography>
          </div>

          {/* Rejection Reason Box + Instructions */}
          <div className="w-full rounded-xl bg-grey-50 px-4 py-3 text-left">
            {reviewMessage && (
              <Typography variant={TYPOGRAPHY.R4} className="text-grey-500">
                {reviewMessage}
              </Typography>
            )}
            <Typography
              variant={TYPOGRAPHY.R4}
              className={reviewMessage ? "mt-2 text-grey-500" : "text-grey-500"}
            >
              Please, fix the issues stated before and then apply for review
              again.
            </Typography>
          </div>
        </div>

        {/* Buttons */}
        <div className="grid w-full gap-4 md:grid-cols-2">
          <DecoratedButton
            type="button"
            variant="secondary"
            onClick={() => setOpen(false)}
          >
            <Typography variant={TYPOGRAPHY.R3}>Cancel</Typography>
          </DecoratedButton>
          <DecoratedButton type="button" onClick={handleResolve}>
            <Typography variant={TYPOGRAPHY.R3}>Resolve issues</Typography>
          </DecoratedButton>
        </div>
      </DialogPanel>
    </Dialog>
  );
};
