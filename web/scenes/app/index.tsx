import { Layout } from "common/Layout";
import { Preloader } from "common/Preloader";
import { useAppsContext } from "contexts/AppsContext";
import { useRouter } from "next/router";
import { memo, useEffect, useState } from "react";
import { AppHeader } from "./AppHeader";
import { Configuration } from "./Configuration";
import { Stats } from "./Stats";

export const App = memo(function App(props: { appId: string }) {
  const { currentApp, selectAppById } = useAppsContext();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    selectAppById(props.appId);
  }, [props.appId, selectAppById]);

  useEffect(() => {
    if (!currentApp) {
      return;
    }

    setLoading(false);
  }, [currentApp]);

  const router = useRouter();

  return (
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
  );
});
