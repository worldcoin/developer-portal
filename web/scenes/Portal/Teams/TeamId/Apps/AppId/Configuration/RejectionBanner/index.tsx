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
        "flex items-center justify-between gap-4 rounded-2xl bg-system-warning-100 px-6 py-4",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <AlertIcon className="mt-0.5 size-5 flex-shrink-0 text-system-warning-600" />

        <Typography variant={TYPOGRAPHY.R4} className="text-system-warning-800">
          {displayMessage}
        </Typography>
      </div>

      {/* Resolve Button */}
      <Button
        type="button"
        onClick={onResolve}
        className="flex-shrink-0 rounded-lg bg-system-warning-600 px-4 py-2 text-white hover:bg-system-warning-700"
      >
        <Typography variant={TYPOGRAPHY.M4} className="whitespace-nowrap">
          Resolve
        </Typography>
      </Button>
    </div>
  );
};
