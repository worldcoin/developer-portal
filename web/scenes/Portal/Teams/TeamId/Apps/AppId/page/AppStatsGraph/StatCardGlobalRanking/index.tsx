"use server";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import Skeleton from "react-loading-skeleton";
import { getAppRanking } from "../../server";

const title = "Global ranking";

export const StatCardGlobalRanking = async (props: { appId: string }) => {
  const value = await getAppRanking(props.appId);
  const splitValue = value.split(" / ") as [string, string];

  return (
    <div className="flex flex-col gap-y-2">
      <Typography variant={TYPOGRAPHY.R3} className="text-grey-900">
        {title}
      </Typography>
      <div className="flex items-center gap-x-2">
        {value ? (
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
