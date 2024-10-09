import { GetAppsQuery } from "@/api/v2/public/apps/graphql/get-app-rankings.generated";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import clsx from "clsx";
import Skeleton from "react-loading-skeleton";

const title = "Global ranking";

const calculatePercentageChange = (oldValue: number, newValue: number) => {
  return ((newValue - oldValue) / oldValue) * 100;
};

const getAppRanking = async (appId: string) => {
  const apps = (await (
    await fetch(new URL("/api/v2/public/apps", process.env.NEXT_PUBLIC_APP_URL))
  ).json()) as GetAppsQuery;

  const app = apps.top_apps.find((app) => app.app_id === appId);
  if (!app) {
    throw new Error(`App with id ${appId} not found`);
  }
  const appIndex = apps.top_apps.indexOf(app);
  const appRanking = `${appIndex + 1} / ${apps.top_apps.length}`;

  return appRanking as `${number} / ${number}`;
};

export const StatCardGlobalRanking = async (props: { appId: string }) => {
  const value = await getAppRanking(props.appId);
  const splitValue = value.split(" / ") as [string, string];
  const changePercentage = 0.0;

  return (
    <div className="flex flex-col gap-y-2">
      <div className="grid grid-cols-auto/1fr items-center gap-x-1 gap-y-2">
        <Typography variant={TYPOGRAPHY.R3} className="text-grey-900">
          {title}
        </Typography>

        <div
          className={clsx("grid grid-cols-auto/1fr items-center gap-x-1", {
            "text-system-success-500": changePercentage > 0,
            "text-system-error-500": changePercentage < 0,
            "text-grey-500": changePercentage === 0,
          })}
        >
          <Typography variant={TYPOGRAPHY.R3}>
            {Math.abs(changePercentage).toFixed(1)}%
          </Typography>
        </div>
      </div>
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
