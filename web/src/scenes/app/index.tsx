import { memo, useEffect, useState } from "react";
import { AuthRequired } from "src/components/AuthRequired";
import { Layout } from "src/components/Layout";
import { Preloader } from "src/components/Preloader";
import { IAppStore, useAppStore } from "@/stores/appStore";
import { AppHeader } from "./AppHeader";
import { Configuration } from "./Configuration";
import { Stats } from "./Stats";

const getStoreParams = (store: IAppStore) => ({
  currentApp: store.currentApp,
});

export const App = memo(function App(props: { appId: string }) {
  const { currentApp } = useAppStore(getStoreParams);

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
