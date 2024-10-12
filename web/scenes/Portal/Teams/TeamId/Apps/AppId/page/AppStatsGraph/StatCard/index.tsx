import { TYPOGRAPHY, Typography } from "@/components/Typography";
import clsx from "clsx";
import Skeleton from "react-loading-skeleton";

export const StatCard = (props: {
  mainColorClassName: string;
  title: string;
  value: number | undefined | null;
  isLoading: boolean;
  changePercentage?: number;
}) => {
  return (
    <div className="flex flex-col gap-y-2">
      <div className="grid grid-cols-auto/1fr items-center gap-x-1 ">
        <Typography variant={TYPOGRAPHY.R3} className="text-grey-900">
          {props.title}
        </Typography>

        {props.changePercentage !== undefined && (
          <div
            className={clsx("grid grid-cols-auto/1fr items-center gap-x-1", {
              "text-system-success-500": props.changePercentage > 0,
              "text-system-error-500": props.changePercentage < 0,
              "text-grey-500": props.changePercentage === 0,
            })}
          >
            <Typography variant={TYPOGRAPHY.R3}>
              {Math.abs(props.changePercentage).toFixed(1)}%
            </Typography>
          </div>
        )}
      </div>
      <div className="flex items-center gap-x-2">
        <Typography variant={TYPOGRAPHY.H3} className="text-grey-700">
          {props.value?.toLocaleString() ??
            (props.isLoading ? <Skeleton width={65} /> : 0)}
        </Typography>
      </div>
    </div>
  );
};
