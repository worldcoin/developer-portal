import { AuthRequired } from "src/common/AuthRequired";
import { Layout } from "src/common/Layout";
import { Preloader } from "src/common/Preloader";
import { memo, useEffect, useState } from "react";
import { useAppStore } from "src/stores/appStore";
import { AppHeader } from "./AppHeader";
import { Configuration } from "./Configuration";
import { Stats } from "./Stats";
import { shallow } from "zustand/shallow";

export const App = memo(function App(props: { appId: string }) {
  const { currentApp, fetchApps } = useAppStore(
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
