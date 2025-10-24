import { TYPOGRAPHY, Typography } from "@/components/Typography";
import clsx from "clsx";
import Skeleton from "react-loading-skeleton";
import { ReactNode } from "react";

export const Stat = (props: {
  loading?: boolean;
  mainColorClassName?: string;
  title: string;
  value: number | string | undefined | null;
  icon?: ReactNode;
  valuePrefix?: string;
  valueSuffix?: string;
  // TODO DEV-1153
  // changePercentage: number;
}) => {
  if (props.loading) {
    return (
      <div className="gap-1/2 flex flex-col">
        <Skeleton width={120} />
        <Skeleton width={30} />
      </div>
    );
  }
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

          <Typography variant={TYPOGRAPHY.R4} className="text-grey-400">
            {props.title}
          </Typography>
        </div>
      </div>

      <div className="flex items-center gap-x-0.5">
        {props.icon}
        <Typography variant={TYPOGRAPHY.H6}>
          {localizedValue ? statValue : <Skeleton width={65} />}
        </Typography>
      </div>
    </div>
  );
};
