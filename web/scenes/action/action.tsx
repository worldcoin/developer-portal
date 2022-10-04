import { NotFound } from "common/NotFound";
import { Preloader } from "common/Preloader";
import { Tab } from "common/Tabs/types";
import { useActions, useValues } from "kea";
import { actionLogic } from "logics/actionLogic";
import { useRouter } from "next/router";
import { useCallback, useEffect, useState } from "react";
import { urls } from "urls";
import { Deployment } from "./Deployment";
import { Display } from "./Display";
import { Stats } from "./Stats";
import { Layout } from "common/Layout";
import { ActionHeader } from "./ActionHeader";

export function Action(): JSX.Element | null {
  const { currentAction, currentActionLoading, actionTabs } =
    useValues(actionLogic);
  const { loadAction, updateAction } = useActions(actionLogic);

  // Reset scroll on currentAction change
  useEffect(() => {
    document.querySelector("main")?.scrollTo(0, 0);
  }, [currentAction?.id]);

  const router = useRouter();
  useEffect(() => {
    if (!router.query.action_id) {
      return;
    }
    loadAction({ id: router.query.action_id as string });
  }, [loadAction, router.query]);

  const [tab, setTab] = useState<Tab>();

  // Restore tab from route
  useEffect(() => {
    setTab(
      actionTabs.find(
        (tab) => tab.name.toLowerCase() === (router.query.tab as string)
      ) || actionTabs[0]
    );
  }, [actionTabs, router.query.tab, tab]);

  const handleChangeTab = useCallback(
    (currentTab: Tab) => {
      if (!currentAction?.id) {
        return;
      }

      router.push({
        pathname: "/actions/[action_id]/[tab]",
        query: {
          action_id: currentAction?.id as string,
          tab: currentTab.name,
        },
      });
    },
    [currentAction?.id, router]
  );

  if (!currentAction && currentActionLoading) {
    return (
      <div className="w-full h-full flex justify-center items-center">
        <Preloader className="w-20 h-20" />
      </div>
    );
  }

  return (
    <Layout
      title={currentAction?.name}
      mainClassName="p-0 lg:p-0 xl:p-0 flex flex-col"
    >
      {currentAction && (
        <ActionHeader
          action={currentAction}
          isLoading={currentActionLoading}
          updateAction={updateAction}
          tabs={actionTabs}
          currentTab={tab}
          setTab={handleChangeTab}
        />
      )}

      <div className="px-4 lg:px-8 xl:px-16 grow flex flex-col">
        {currentAction && tab && tab.name === "deployment" && <Deployment />}
        {currentAction && tab && tab.name === "display" && <Display />}
        {currentAction &&
          tab &&
          tab.name === "stats" &&
          currentAction.engine !== "on-chain" && <Stats />}

        {!currentAction && (
          <NotFound
            heading="Action not found"
            description="It seems like we can't find the action you're looking for. Please, try creating a new one!"
            icon="action-not-found"
            link={urls.actions()}
            linkLabel="Go to all actions"
          />
        )}
      </div>
    </Layout>
  );
}
