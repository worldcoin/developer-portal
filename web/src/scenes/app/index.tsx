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

const getStore = (store: IAppStore) => ({
  currentApp: store.currentApp,
});

export const App = memo(function App(props: {
  appId: string;
  user_id?: string;
}) {
  const { isLoading } = useApps();
  const { currentApp } = useAppStore(getStore, shallow);

  const removeAppDialog = useToggle();

  return (
    <Layout userId={props.user_id}>
      {isLoading && (
        <div className="w-full h-full flex justify-center items-center">
          <Preloader className="w-20 h-20" />
        </div>
      )}

      {!isLoading && !currentApp && (
        <div className="w-full h-full flex justify-center items-center">
          <h1 className="text-20 font-sora font-semibold">App not found</h1>
        </div>
      )}

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
            Remove app
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
