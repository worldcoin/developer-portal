"use server";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import Skeleton from "react-loading-skeleton";
import { AppMetricsData, getAppMetricsData } from "../../server";

const title = "Global ranking";

export const StatCardGlobalRanking = async (props: { appId: string }) => {
  let splitValue: [string, string] | undefined;
  const result = await getAppMetricsData(props.appId);
  if (result.success) {
    const value = result.data as AppMetricsData;
    splitValue = value.appRanking.split(" / ") as [string, string];
  }

  return (
    <div className="flex flex-col gap-y-2">
      <Typography variant={TYPOGRAPHY.R3} className="text-grey-900">
        {title}
      </Typography>
      <div className="flex items-center gap-x-2">
        {splitValue ? (
          <Typography variant={TYPOGRAPHY.H3} className="text-grey-700">
            <span>{splitValue[0]}</span>
            <span className="text-grey-300"> / {splitValue[1]}</span>
          </Typography>
        ) : (
          <Skeleton width={65} />
        )}
      </div>
    </div>
  );
};
