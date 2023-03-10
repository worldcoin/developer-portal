import { gql } from "@apollo/client";
import dayjs from "dayjs";
import { graphQLRequest } from "src/lib/frontend-api";
import { AppStatsModel } from "src/lib/models";
import { IAppStatsStore, useAppStatsStore } from "src/stores/appStatsStore";
import { IAppStore, useAppStore } from "src/stores/appStore";
import useSWR from "swr";
import utc from "dayjs/plugin/utc";
import tz from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(tz);

const FetchAppStatsQuery = gql`
  query AppStats($appId: String!, $startsAt: timestamptz!, $timeSpan: String!) {
    app_stats(
      args: { appId: $appId, startsAt: $startsAt, timespan: $timeSpan }
    ) {
      app_id
      date
      verifications
      unique_users
    }
  }
`;

const fetchAppStats = async (_key: [string, string | undefined]) => {
  const { currentTimeSpan } = useAppStatsStore.getState();
  const currentApp = useAppStore.getState().currentApp;

  if (!currentApp) {
    throw new Error("No current app");
  }

  console.log(dayjs().startOf(currentTimeSpan.value).tz().toISOString());

  const response = await graphQLRequest<{
    app_stats: Array<AppStatsModel>;
  }>({
    query: FetchAppStatsQuery,
    variables: {
      appId: currentApp.id,
      startsAt: dayjs().startOf(currentTimeSpan.value).tz().toISOString(),
      timeSpan: "day",
    },
  });

  if (response.data?.app_stats.length) {
    return response.data.app_stats;
  }

  return [];
};

const getAppStore = (store: IAppStore) => ({
  currentApp: store.currentApp,
});

const getAppStatsStore = (store: IAppStatsStore) => ({
  setStats: store.setStats,
  currentTimeSpan: store.currentTimeSpan,
});

const useAppStats = () => {
  const { currentApp } = useAppStore(getAppStore);
  const { setStats, currentTimeSpan } = useAppStatsStore(getAppStatsStore);

  const { data, error, isLoading } = useSWR<Array<AppStatsModel>>(
    ["app_stat", currentApp?.id, currentTimeSpan],
    fetchAppStats,
    {
      onSuccess: (data) => {
        if (data.length) {
          setStats(data);
        }
      },
    }
  );

  return {
    stats: data,
    error,
    isLoading,
  };
};

export default useAppStats;
