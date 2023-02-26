import { NotFound } from "common/NotFound";
import { Preloader } from "common/Preloader";
import { Tab } from "common/Tabs/types";
import { useActions, useValues } from "kea";
import { actionLogic, InterfaceConfigFormValues } from "logics/actionLogic";
import { useRouter } from "next/router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { urls } from "urls";
import { Deployment } from "./Deployment";
import { Stats } from "./Stats";
import { Layout } from "common/Layout";
import { ActionHeader } from "./ActionHeader";
import { Footer } from "common/Footer";
import { Button } from "common/LegacyButton";

export function Action(): JSX.Element | null {
  const [isFooterVisible, setIsFooterVisible] = useState(false);

  const {
    currentAction,
    currentActionLoading,
    actionTabs,
    interfaceConfigChanged,
    interfaceConfigHasErrors,
    isInterfaceConfigSubmitting,
  } = useValues(actionLogic);

  const {
    loadAction,
    updateAction,
    resetInterfaceConfig,
    submitInterfaceConfig,
    setAfterInterfaceConfigSubmitSuccess,
  } = useActions(actionLogic);

  useEffect(() => {
    interfaceConfigChanged && setIsFooterVisible(true);
  }, [interfaceConfigChanged]);

  const defaultValues: InterfaceConfigFormValues = useMemo(
    () => ({
      public_description: currentAction?.public_description,

      widget: currentAction?.user_interfaces.enabled_interfaces?.some(
        (userInterface) => userInterface === "widget"
      ),

      hosted_page: currentAction?.user_interfaces.enabled_interfaces?.some(
        (userInterface) => userInterface === "hosted_page"
      ),

      hosted_page_return_url: currentAction?.return_url,

      kiosk: currentAction?.user_interfaces.enabled_interfaces?.some(
        (userInterface) => userInterface === "kiosk"
      ),
    }),

    [
      currentAction?.public_description,
      currentAction?.return_url,
      currentAction?.user_interfaces.enabled_interfaces,
    ]
  );

  const submit = useCallback(() => {
    setAfterInterfaceConfigSubmitSuccess(
      (newFormValues: InterfaceConfigFormValues) => {
        resetInterfaceConfig(newFormValues);
      }
    );

    submitInterfaceConfig();
    setIsFooterVisible(false);
  }, [
    resetInterfaceConfig,
    setAfterInterfaceConfigSubmitSuccess,
    submitInterfaceConfig,
  ]);

  const discard = useCallback(() => {
    setIsFooterVisible(false);
    resetInterfaceConfig(defaultValues);
  }, [defaultValues, resetInterfaceConfig]);

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
        {currentAction &&
          tab &&
          tab.name === "stats" &&
          currentAction.engine !== "on-chain" && <Stats />}

        {!currentAction && (
          <NotFound
            heading="Action not found"
            description="It seems like we can't find the action you're looking for. Please, try creating a new one!"
            icon="action-not-found"
            link={urls.actions("custom")}
            linkLabel="Go to all actions"
          />
        )}
      </div>

      {isFooterVisible && (
        <Footer>
          <div className="grid grid-cols-1fr/auto items-center">
            <span className="text-14 text-neutral">
              You have unsaved changes.
            </span>

            <div className="grid grid-flow-col gap-x-8">
              <Button
                className="uppercase"
                color="danger"
                variant="default"
                onClick={discard}
                disabled={isInterfaceConfigSubmitting}
              >
                discard
              </Button>

              <Button
                className="uppercase"
                color="primary"
                variant="contained"
                onClick={submit}
                disabled={
                  isInterfaceConfigSubmitting || interfaceConfigHasErrors
                }
              >
                save changes
              </Button>
            </div>
          </div>
        </Footer>
      )}
    </Layout>
  );
}
