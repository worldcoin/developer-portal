import clsx from "clsx";
import { twMerge } from "tailwind-merge";

type ProgressBarProps = {
  value: number;
  max: number;
  label: string;
  className?: string;
};

export const ProgressBar = ({
  value,
  max,
  label,
  className,
}: ProgressBarProps) => {
  const safeMax = Math.max(1, max);
  const safeValue = Math.min(Math.max(0, value), safeMax);
  const percentage = (safeValue / safeMax) * 100;

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={safeMax}
      aria-valuenow={safeValue}
      className={twMerge(
        clsx(
          "h-1.5 w-full overflow-hidden rounded-full bg-grey-100",
          className,
        ),
      )}
    >
      <div
        aria-hidden
        className="h-full rounded-full bg-blue-500 transition-[width] duration-300 ease-out"
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
};
