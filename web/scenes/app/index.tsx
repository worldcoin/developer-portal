import { Layout } from "common/Layout";
import { Preloader } from "common/Preloader";
import { memo, useEffect, useState } from "react";
import { AppStore, useAppStore } from "stores/app-store";
import { AppHeader } from "./AppHeader";
import { Configuration } from "./Configuration";
import { Stats } from "./Stats";

const appParams = ({
  apps,
  currentApp,
  setCurrentApp,
  fetchApps,
}: AppStore) => ({
  apps,
  currentApp,
  setCurrentApp,
  fetchApps,
});

export const App = memo(function App(props: { appId: string }) {
  const [loading, setLoading] = useState(true);
  const { apps, currentApp, setCurrentApp, fetchApps } = useAppStore(appParams);

  useEffect(() => {
    fetchApps();
    console.log("apps:", apps);
  }, []);

  useEffect(() => {
    if (!currentApp) {
      const app = apps.find((app) => app.id === props.appId);
      if (app) {
        setCurrentApp(app);
        console.log("currentApp:", currentApp);
      }
    }
  }, [apps, currentApp, props.appId, setCurrentApp]);

  useEffect(() => {
    if (!currentApp) {
      return;
    }

    setLoading(false);
  }, [currentApp]);

  return (
    // <AuthRequired>
    <Layout>
      {loading ||
        (!currentApp && (
          <div className="w-full h-full flex justify-center items-center">
            <Preloader className="w-20 h-20" />
          </div>
        ))}

      {!loading && currentApp && (
        <div className="grid gap-y-12">
          <AppHeader app={currentApp} />
          <Configuration app={currentApp} />
          <Stats />
        </div>
      )}
    </Layout>
    // </AuthRequired>
  );
});
