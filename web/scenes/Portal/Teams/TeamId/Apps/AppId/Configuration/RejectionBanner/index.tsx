import { Button } from "@/components/Button";
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
        "flex items-center justify-between gap-4 rounded-2xl bg-amber-50 px-6 py-4",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        {/* Warning Icon */}
        <div className="flex-shrink-0">
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="mt-0.5 text-amber-600"
          >
            <path
              d="M10 6V10M10 14H10.01M4.93 3.5C3.5 5.59 2 8.19 2 10C2 14.42 5.58 18 10 18C14.42 18 18 14.42 18 10C18 8.19 16.5 5.59 15.07 3.5C13.64 1.41 11.82 0 10 0C8.18 0 6.36 1.41 4.93 3.5Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        {/* Message */}
        <Typography variant={TYPOGRAPHY.R4} className="text-amber-900">
          {displayMessage}
        </Typography>
      </div>

      {/* Resolve Button */}
      <Button
        type="button"
        onClick={onResolve}
        className="flex-shrink-0 rounded-lg bg-amber-600 px-4 py-2 text-white hover:bg-amber-700"
      >
        <Typography variant={TYPOGRAPHY.M4} className="whitespace-nowrap">
          Resolve
        </Typography>
      </Button>
    </div>
  );
};
