import { ArrowRightIcon } from "@/components/Icons/ArrowRightIcon";
import { ArrowUpIcon } from "@/components/Icons/ArrowUpIcon";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import clsx from "clsx";

export const StatCard = (props: {
  mainColorClassName: string;
  title: string;
  value: number;
  changePercentage: number;
}) => {
  return (
    <div>
      <div className="grid grid-cols-auto/1fr gap-x-1 items-center">
        <div
          className={clsx(
            "w-1.5 h-1.5 rounded-[1px]",
            props.mainColorClassName,
          )}
        />

        <Typography variant={TYPOGRAPHY.R5} className="text-grey-400">
          {props.title}
        </Typography>
      </div>

      <div className="flex items-center gap-x-2">
        <Typography variant={TYPOGRAPHY.H6} className="text-grey-700">
          {props.value.toLocaleString()}
        </Typography>

        <div
          className={clsx("grid grid-cols-auto/1fr items-center gap-x-1", {
            "text-system-success-500": props.changePercentage > 0,
            "text-system-error-500": props.changePercentage < 0,
            "text-grey-500": props.changePercentage === 0,
          })}
        >
          <div
            className={clsx(
              "w-4 h-4 flex items-center justify-center rounded-full",
              {
                "bg-system-success-50 text-system-success-500":
                  props.changePercentage > 0,
                "bg-system-error-50 text-system-error-500":
                  props.changePercentage < 0,
                "bg-grey-100": props.changePercentage === 0,
              },
            )}
          >
            <ArrowUpIcon
              className={clsx("w-3 h-3", {
                "rotate-180": props.changePercentage < 0,
                hidden: props.changePercentage === 0,
              })}
            />

            <div
              className={clsx("w-2 h-2 rounded-full bg-grey-500", {
                hidden: props.changePercentage !== 0,
              })}
            />
          </div>

          <Typography variant={TYPOGRAPHY.M5}>
            {Math.abs(props.changePercentage).toFixed(1)}%
          </Typography>
        </div>
      </div>
    </div>
  );
};
