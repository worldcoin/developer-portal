import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { ReactNode } from "react";

type DangerZoneCardProps = {
  name: ReactNode;
  footerText?: ReactNode;
  footerAction?: ReactNode;
  title?: ReactNode;
  variant?: "default" | "compact";
};

/** Shared danger-zone card chrome for destructive app and action settings. */
export const DangerZoneCard = ({
  name,
  footerText,
  footerAction,
  title = "Delete this app",
  variant = "default",
}: DangerZoneCardProps) => (
  <div className="overflow-hidden rounded-2xl border border-system-error-200 bg-grey-0">
    <div
      className={
        variant === "compact" ? "grid gap-y-2 p-5" : "grid gap-y-2 p-6"
      }
    >
      <Typography
        as="h3"
        variant={variant === "compact" ? TYPOGRAPHY.S2 : TYPOGRAPHY.M3}
        className="text-grey-900"
      >
        {title}
      </Typography>

      <Typography
        variant={variant === "compact" ? TYPOGRAPHY.B3 : TYPOGRAPHY.R3}
        className="max-w-2xl text-grey-500"
      >
        Permanently delete{" "}
        <Typography
          variant={variant === "compact" ? TYPOGRAPHY.S2 : TYPOGRAPHY.M3}
          className="text-grey-900"
        >
          {name}
        </Typography>{" "}
        and all of its data for everyone. This action cannot be undone.
      </Typography>
    </div>

    <div
      className={
        variant === "compact"
          ? "flex items-center gap-4 px-5 pb-5"
          : "flex items-center gap-4 px-6 pb-6"
      }
    >
      {footerAction}

      {footerText && (
        <Typography
          variant={variant === "compact" ? TYPOGRAPHY.B4 : TYPOGRAPHY.R4}
          className="text-system-error-700"
        >
          {footerText}
        </Typography>
      )}
    </div>
  </div>
);
