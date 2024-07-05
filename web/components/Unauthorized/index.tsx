import { Typography, TYPOGRAPHY } from "@/components/Typography";
import clsx from "clsx";
import { twMerge } from "tailwind-merge";

export const Unauthorized = (props: {
  className?: string;
  code?: number;
  code_detail?: string;
  message?: string;
}) => {
  const {
    className,
    code = 401,
    code_detail = "Unauthorized",
    message,
  } = props;

  return (
    <div
      className={twMerge(
        clsx("flex h-full flex-col items-center justify-center", className),
      )}
    >
      <div
        className={twMerge(clsx("flex items-center justify-center gap-x-2"))}
      >
        <Typography variant={TYPOGRAPHY.M2}>{code}</Typography>
        <div className="h-5 w-px bg-grey-400" />

        <Typography variant={TYPOGRAPHY.R3} className="text-grey-400">
          {code_detail}
        </Typography>
      </div>
      <Typography
        variant={TYPOGRAPHY.R5}
        className={clsx({ hidden: !message })}
      >
        {props.message}
      </Typography>
    </div>
  );
};
