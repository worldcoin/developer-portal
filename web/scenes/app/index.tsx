import { Icon } from "common/Icon";
import { Layout } from "common/Layout";
import { NotFound } from "common/NotFound";
import { Preloader } from "common/Preloader";
import { useAppsContext } from "contexts/AppsContext";
import { GetServerSideProps } from "next";
import Image from "next/image";
import { useRouter } from "next/router";
import { Fragment, memo, useCallback, useEffect, useState } from "react";
import { ActionList } from "scenes/actions/ActionList";
import { urls } from "urls";
import { AppCard } from "./AppCard";
import { Switch } from "@headlessui/react";
import cn from "classnames";
import { AppHeader } from "./AppHeader";
import { Configuration } from "./Configuration";
import { Stats } from "./Stats";

export const App = memo(function App(props: { appId: string }) {
  const { currentApp, selectAppById } = useAppsContext();
  const [loading, setLoading] = useState(true);
  const [enabled, setEnabled] = useState(currentApp?.status === "active");

  useEffect(() => {
    selectAppById(props.appId);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- NOTE: setting app on mount
  }, []);

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

      {/* {!loading && (
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
      )} */}
    </Layout>
  );
});
