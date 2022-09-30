import { ActionCard } from "scenes/action/ActionCard/ActionCard";
import { NotFound } from "common/NotFound";
import { Preloader } from "common/Preloader";
import { Tabs } from "common/Tabs";
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
    <Layout title={currentAction?.name}>
      <div className="grid gap-y-8 min-h-full">
        {currentAction && (
          <ActionCard
            action={currentAction}
            isLoading={currentActionLoading}
            updateAction={updateAction}
          />
        )}

        {currentAction && tab && (
          <Tabs tabs={actionTabs} currentTab={tab} setTab={handleChangeTab}>
            {tab.name === "deployment" && <Deployment />}
            {tab.name === "display" && <Display />}
            {tab.name === "stats" && currentAction.engine !== "on-chain" && (
              <Stats />
            )}
          </Tabs>
        )}

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
