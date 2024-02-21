import { Typography, TYPOGRAPHY } from "@/components/Typography";
import clsx from "clsx";
import { twMerge } from "tailwind-merge";

export const Unauthorized = (props: {
  className?: string;
  code?: number;
  message?: string;
}) => {
  const { className, code = 401, message = "Unauthorized" } = props;

  return (
    <div
      className={twMerge(
        clsx("flex h-full items-center justify-center gap-x-2", className),
      )}
    >
      <Typography variant={TYPOGRAPHY.M2}>{code}</Typography>
      <div className="h-5 w-px bg-grey-400" />

      <Typography variant={TYPOGRAPHY.R3} className="text-grey-400">
        {message}
      </Typography>
    </div>
  );
};
