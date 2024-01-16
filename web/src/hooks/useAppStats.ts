import { gql } from "@apollo/client";
import dayjs from "dayjs";
import { graphQLRequest } from "src/lib/frontend-api";
import { AppStatsModel } from "src/lib/models";
import { IAppStatsStore, useAppStatsStore } from "src/stores/appStatsStore";
import { IAppStore, useAppStore } from "src/stores/appStore";
import useSWR from "swr";
import utc from "dayjs/plugin/utc";
import tz from "dayjs/plugin/timezone";
import { useRouter } from "next/router";

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

const fetchAppStats = async ([_key, team_id]: [string, string | undefined]) => {
  const { currentTimeSpan } = useAppStatsStore.getState();
  const currentApp = useAppStore.getState().currentApp;

  if (!currentApp) {
    throw new Error("No current app");
  }

  const response = await graphQLRequest<{
    app_stats: Array<AppStatsModel>;
  }>(
    {
      query: FetchAppStatsQuery,
      variables: {
        appId: currentApp.id,
        startsAt: dayjs().startOf(currentTimeSpan.value).tz().toISOString(),
        timeSpan: "day",
      },
    },
    undefined,
    {
      team_id: team_id ?? "",
    }
  );

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
  const router = useRouter();
  const team_id = router.query.team_id as string | undefined;

  const { data, error, isLoading } = useSWR<Array<AppStatsModel>>(
    ["fetchAppStats", team_id],
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
