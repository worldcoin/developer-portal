import { Button } from "@/components/Button";
import { AlertIcon } from "@/components/Icons/AlertIcon";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import clsx from "clsx";

type RejectionBannerProps = {
  message?: string | null;
  onResolve: () => void;
  className?: string;
};

export const RejectionBanner = ({
  message,
  onResolve,
  className,
}: RejectionBannerProps) => {
  const displayMessage =
    message || "Review was rejected. Please check the details and resubmit.";

  return (
    <div
      className={clsx(
        "flex items-center gap-3 rounded-20 bg-system-warning-100 p-5",
        className,
      )}
    >
      {/* Icon */}
      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-system-warning-600">
        <AlertIcon className="size-4 text-white" />
      </div>

      {/* Label */}
      <Typography
        variant={TYPOGRAPHY.R4}
        className="flex-1 text-system-warning-600"
      >
        {displayMessage}
      </Typography>

      {/* Resolve Button */}
      <Button
        type="button"
        onClick={onResolve}
        className="shrink-0 rounded-full bg-system-warning-600 px-4 py-2 text-white hover:opacity-90"
      >
        <Typography variant={TYPOGRAPHY.M4} className="whitespace-nowrap">
          Resolve
        </Typography>
      </Button>
    </div>
  );
};
