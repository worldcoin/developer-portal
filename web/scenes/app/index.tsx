import { Layout } from "common/Layout";
import { NotFound } from "common/NotFound";
import { Preloader } from "common/Preloader";
import { useActions, useValues } from "kea";
import { appLogic } from "logics/appLogic";
import { appsLogic } from "logics/appsLogic";
import { useRouter } from "next/router";
import { Fragment, memo, useCallback, useEffect, useMemo } from "react";
import { ActionList } from "scenes/actions/ActionList";
import { AppType } from "types";
import { urls } from "urls";
import { AppCard } from "./AppCard";

export const App = memo(function App() {
  const router = useRouter();
  const { app, appLoading } = useValues(appLogic);
  const { loadApp, updateApp } = useActions(appLogic);
  const { deleteApp } = useActions(appsLogic);
  const { appsLoading } = useValues(appsLogic);

  useEffect(() => {
    if (!router.query.app_id) {
      return;
    }
    loadApp({ app_id: router.query.app_id as string });
  }, [loadApp, router.query.app_id]);

  const loading = useMemo(
    () => appsLoading || appLoading,
    [appsLoading, appLoading]
  );

  const handleUpdateApp = useCallback(
    ({ attr, value }: { attr: string; value: string }) => {
      if (!app || !(attr in app)) {
        return;
      }
      updateApp({ attr: attr as keyof AppType, value });
    },
    [app, updateApp]
  );

  const handleDeleteApp = useCallback(() => {
    if (!app?.id) {
      return null;
    }

    deleteApp({ app_id: app.id });
  }, [app?.id, deleteApp]);

  return (
    <Layout>
      {loading && (
        <div className="w-full h-full flex justify-center items-center">
          <Preloader className="w-20 h-20" />
        </div>
      )}

      {!loading && (
        <Fragment>
          {!app && (
            <NotFound
              icon="actions-empty"
              heading="Sorry, this app not found"
              description="But you can create new one"
              link={`${urls.appNew()}`}
              linkLabel="Create new app"
            />
          )}

          {app && (
            <div className="grid gap-y-8">
              <AppCard
                app={app}
                deleteAction={handleDeleteApp}
                updateAction={handleUpdateApp}
              />
              {app ? (
                <ActionList withoutCreateButton />
              ) : (
                <NotFound
                  icon="actions-empty"
                  heading="You don't have any actions yet"
                  description="It's time to create your first action!"
                  link={`${urls.actionNew()}`}
                  linkLabel="Create new action"
                />
              )}
            </div>
          )}
        </Fragment>
      )}
    </Layout>
  );
});
