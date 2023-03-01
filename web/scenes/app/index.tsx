import { AuthRequired } from "common/AuthRequired";
import { Layout } from "common/Layout";
import { Preloader } from "common/Preloader";
import { memo, useEffect, useState } from "react";
import { useAppsStore } from "stores/appStore";
import { AppHeader } from "./AppHeader";
import { Configuration } from "./Configuration";
import { Stats } from "./Stats";
import { shallow } from "zustand/shallow";

export const App = memo(function App(props: { appId: string }) {
  const { currentApp, fetchApps } = useAppsStore(
    (state) => ({
      ...state,
    }),
    shallow
  );

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentApp) {
      return;
    }

    setLoading(false);
  }, [currentApp]);

  return (
    <AuthRequired>
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
    </AuthRequired>
  );
});
