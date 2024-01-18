import { memo } from "react";
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

const getStore = (store: IAppStore) => ({
  currentApp: store.currentApp,
});

export const App = memo(function App() {
  const { isLoading } = useApps();
  const { currentApp } = useAppStore(getStore, shallow);

  const removeAppDialog = useToggle();

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
