import { memo, useEffect, useMemo } from "react";
import { Layout } from "src/components/Layout";
import { Preloader } from "src/components/Preloader";
import { IAppStore, useAppStore } from "src/stores/appStore";
import { AppHeader } from "./AppHeader";
import { Configuration } from "./Configuration";
import { Stats } from "./Stats";
import { shallow } from "zustand/shallow";
import useApps from "src/hooks/useApps";
import { useToggle } from "@/hooks/useToggle";
import { RemoveAppDialog } from "@/scenes/app/RemoveAppDialog";
import { Button } from "@/components/Button";
import { NotFound } from "src/components/NotFound";
import { useRouter } from "next/router";

const getStore = (store: IAppStore) => ({
  currentApp: store.currentApp,
  setCurrentApp: store.setCurrentApp,
});

export const App = memo(function App() {
  const { isLoading, apps } = useApps();
  const { currentApp, setCurrentApp } = useAppStore(getStore, shallow);
  const removeAppDialog = useToggle();
  const router = useRouter();
  const app_id = useMemo(() => router.query.app_id as string, [router.query]);

  useEffect(() => {
    if (!app_id) {
      return;
    }

    setCurrentApp(apps?.find((app) => app.id === app_id) ?? null);
  }, [app_id, apps, setCurrentApp]);

  return (
    <Layout mainClassName="grid">
      {isLoading && (
        <div className="w-full h-full flex justify-center items-center">
          <Preloader className="w-20 h-20" />
        </div>
      )}

      {!isLoading && !currentApp && <NotFound className="self-center" />}

      {!isLoading && currentApp && (
        <div className="grid gap-y-12">
          <AppHeader />
          <Configuration />
          <Stats />
          <Button
            variant="danger"
            className="justify-self-end px-4 py-2"
            onClick={removeAppDialog.toggleOn}
          >
            Delete app
          </Button>
          <RemoveAppDialog
            open={removeAppDialog.isOn}
            onClose={removeAppDialog.toggleOff}
          />
        </div>
      )}
    </Layout>
  );
});
