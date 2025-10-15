import { TYPOGRAPHY, Typography } from "@/components/Typography";
import clsx from "clsx";
import Skeleton from "react-loading-skeleton";

export const Stat = (props: {
  mainColorClassName?: string;
  title: string;
  value: number | string | undefined | null;
  valuePrefix?: string;
  valueSuffix?: string;
  // TODO DEV-1153
  // changePercentage: number;
}) => {
  const localizedValue = props.value?.toLocaleString();

  let statValue = props?.valuePrefix
    ? `${props.valuePrefix} ${localizedValue}`
    : localizedValue;

  statValue = props?.valueSuffix
    ? `${statValue}${props.valueSuffix}`
    : statValue;

  return (
    <div>
      <div className="grid grid-cols-auto/1fr items-center gap-x-1">
        <div className="flex flex-row items-center justify-center gap-1">
          <div
            className={clsx(
              "size-1.5 rounded-[1px]",
              props.mainColorClassName,
              {
                hidden: !props.mainColorClassName,
              },
            )}
          />

          <Typography variant={TYPOGRAPHY.R3} className="text-grey-900">
            {props.title}
          </Typography>
        </div>
        {/* TODO DEV-1153 */}
        {/* <div
          className={clsx("grid grid-cols-auto/1fr items-center gap-x-1", {
            "text-system-success-500": props.changePercentage > 0,
            "text-system-error-500": props.changePercentage < 0,
            "text-grey-500": props.changePercentage === 0,
          })}
        >
          <div
            className={clsx("flex items-center justify-center rounded-full", {
              " text-system-success-500": props.changePercentage > 0,
              " text-system-error-500": props.changePercentage < 0,
              "text-grey-700": props.changePercentage === 0,
            })}
          >
            <Typography variant={TYPOGRAPHY.R3}>
              {props.changePercentage.toFixed(1)}%
            </Typography>
          </div>
        </div> */}
      </div>

      <div className="flex items-center gap-x-2">
        <Typography variant={TYPOGRAPHY.H5} className="text-grey-900">
          {localizedValue ? statValue : <Skeleton width={65} />}
        </Typography>
      </div>
    </div>
  );
};
