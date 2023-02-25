import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useAuthContext } from "./AuthContext";

import {
  apps as tempApps,
  stats as tempStats,
  AppStats,
} from "common/Layout/temp-data";

import { isDevMode } from "common/helpers/is-dev-mode";

export type App = (typeof tempApps)[0];

type AppsContextValue = {
  apps: Array<App> | null;
  currentApp: App | null;
  selectAppById: (id: string) => void;
  toggleAppActivity: (status: boolean) => void;
  stats: Array<AppStats> | null;
};

export const AppsContext = createContext<AppsContextValue>({
  apps: null,
  currentApp: null,
  selectAppById: () => {},
  toggleAppActivity: (status: boolean) => {},
  stats: null,
});

export const AppsProvider = (props: { children: ReactNode }) => {
  const [apps, setApps] = useState<Array<App> | null>(null);
  const [stats, setStats] = useState<Array<AppStats> | null>(null);

  const [currentApp, setCurrentApp] = useState<App | null>(
    apps ? apps[0] : null
  );

  const { token } = useAuthContext();
  //ANCHOR: Do something with token
  console.log(token?.length);

  const fetchApps = useCallback(async () => {
    //TODO: Add relevant apps fetching logic
    setApps(tempApps);
    setCurrentApp(tempApps[0]);
  }, []);

  //TODO: update stats fetching logic
  const fetchAppStats = useCallback(async () => {
    if (!currentApp) {
      if (isDevMode()) {
        console.error(
          "Current app is not selected while trying to fetch app stats"
        );
      }

      return;
    }

    setStats(tempStats[currentApp.id]);
  }, [currentApp]);

  //ANCHOR: Fetch apps on context mount
  useEffect(() => {
    fetchApps();
    fetchAppStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- NOTE: we need to fetch apps only on context creation
  }, []);

  const selectAppById = useCallback(
    (appId: string) => {
      if (!apps) {
        if (isDevMode()) {
          console.error("App list is empty while trying to select current app");
        }

        return;
      }

      const app = apps.find((app) => app.id === appId);

      if (!app) {
        if (isDevMode()) {
          console.error(`App with id ${appId} not found`);
        }

        return;
      }

      return setCurrentApp(app);
    },
    [apps]
  );

  //TODO: Add app activity toggling logic
  const toggleAppActivity = useCallback((status: boolean) => {}, []);

  const value = useMemo(
    () => ({
      apps,
      currentApp,
      stats,
      selectAppById,
      toggleAppActivity,
    }),
    [apps, currentApp, selectAppById, stats, toggleAppActivity]
  );

  return (
    <AppsContext.Provider value={value}>{props.children}</AppsContext.Provider>
  );
};

export const useAppsContext = () => {
  return useContext(AppsContext);
};
