import { Button } from "@/components/Button";
import { CheckmarkBadge } from "@/components/Icons/CheckmarkBadge";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { toast } from "react-toastify";

type SubmitSuccessToastProps = {
  onUndo: () => Promise<boolean>;
  closeToast?: () => void;
};

export const SubmitSuccessToast = ({
  onUndo,
  closeToast,
}: SubmitSuccessToastProps) => {
  const handleUndo = async () => {
    closeToast?.();
    const success = await onUndo();
    if (success) toast.info("App removed from review");
  };

  return (
    <div className="flex items-center gap-x-3">
      <CheckmarkBadge className="size-5 shrink-0 text-content-success-500" />
      <Typography
        variant={TYPOGRAPHY.R3}
        className="flex-1 text-content-primary"
      >
        Your app was submitted for review
      </Typography>
      <div className="flex items-center gap-x-2">
        <Button
          type="button"
          onClick={closeToast}
          className="text-content-secondary hover:text-content-strong"
        >
          <Typography variant={TYPOGRAPHY.R4}>Dismiss</Typography>
        </Button>
        <Button
          type="button"
          onClick={handleUndo}
          className="text-content-link-legacy hover:underline"
        >
          <Typography variant={TYPOGRAPHY.R4}>Undo</Typography>
        </Button>
      </div>
    </div>
  );
};
