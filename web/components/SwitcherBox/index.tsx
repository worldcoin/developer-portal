import { Switcher } from "@/components/Switch";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import clsx from "clsx";

export const SwitcherBox = (props: {
  disabled?: boolean;
  status: boolean;
  title: string;
  description?: string;
  className?: string;
  validToggle: string;
  invalidToggle: string;
  setStatus: (status: boolean) => void;
}) => {
  const {
    disabled,
    status,
    title,
    description,
    className,
    validToggle,
    invalidToggle,
    setStatus,
  } = props;

  return (
    <div
      className={clsx("grid grid-cols-auto/1fr/auto gap-x-4 p-5", className)}
    >
      <Switcher enabled={status} setEnabled={setStatus} disabled={disabled} />
      <div className="grid gap-y-2 ">
        <Typography variant={TYPOGRAPHY.R3}>{title}</Typography>
        {description && (
          <Typography variant={TYPOGRAPHY.R4} className="text-grey-400">
            {description}
          </Typography>
        )}
      </div>
      <div
        className={clsx(
          "grid h-fit grid-cols-auto/1fr items-center gap-x-1.5 rounded-xl px-3 py-1 ",
          {
            "bg-system-success-50 text-system-success-500": status,
            "bg-gray-50 text-grey-400": !status,
          },
        )}
      >
        <div
          className={clsx("size-2 rounded-full", {
            "bg-system-success-500": status,
            "bg-grey-400": !status,
          })}
        />
        <Typography variant={TYPOGRAPHY.S3}>
          {status ? validToggle : invalidToggle}
        </Typography>
      </div>
    </div>
  );
};
