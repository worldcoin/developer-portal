import { AuthRequired } from "src/components/AuthRequired";
import { Layout } from "src/components/Layout";
import { Preloader } from "src/components/Preloader";
import { memo, useEffect, useState } from "react";
import { AppStore, useAppStore } from "src/stores/appStore";
import { AppHeader } from "./AppHeader";
import { Configuration } from "./Configuration";
import { Stats } from "./Stats";
import { shallow } from "zustand/shallow";
import useApps from "src/hooks/useApps";

const getStore = (store: AppStore) => ({
  currentApp: store.currentApp,
});

export const App = memo(function App(props: { appId: string }) {
  const { isLoading } = useApps();
  const { currentApp } = useAppStore(getStore, shallow);

  return (
    <AuthRequired>
      <Layout>
        {(isLoading || !currentApp) && (
          <div className="w-full h-full flex justify-center items-center">
            <Preloader className="w-20 h-20" />
          </div>
        )}

        {!isLoading && currentApp && (
          <div className="grid gap-y-12">
            <AppHeader />
            <Configuration />
            <Stats />
          </div>
        )}
      </Layout>
    </AuthRequired>
  );
});
