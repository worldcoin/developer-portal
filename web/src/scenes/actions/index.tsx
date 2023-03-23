import { Layout } from "@/components/Layout";
import { Action } from "./Action";
import { Button } from "@/components/Button";
import { Link } from "@/components/Link";
import { Icon } from "@/components/Icon";
import useActions from "src/hooks/useActions";
import { NewAction } from "./NewAction";
import { IActionStore, useActionStore } from "src/stores/actionStore";
import useApps from "src/hooks/useApps";
import { Preloader } from "src/components/Preloader";
import { Fragment } from "react";

const getActionsStore = (store: IActionStore) => ({
  setNewActionOpened: store.setIsNewActionModalOpened,
});

export function Actions(props: { user_id?: string }): JSX.Element | null {
  const { currentApp, isLoading: appIsLoading } = useApps();
  const { actions, isLoading: actionIsLoading } = useActions();
  const { setNewActionOpened } = useActionStore(getActionsStore);

  return (
    <Layout title="Actions" userId={props.user_id}>
      {(appIsLoading || actionIsLoading) && (
        <div className="w-full h-full flex justify-center items-center">
          <Preloader className="w-20 h-20" />
        </div>
      )}

      {!appIsLoading && !currentApp && (
        <div className="w-full h-full flex justify-center items-center">
          <h1 className="text-20 font-sora font-semibold">App not found</h1>
        </div>
      )}

      {!appIsLoading && !actionIsLoading && currentApp && (
        <Fragment>
          <NewAction />

          <div className="grid gap-y-12">
            <section className="grid gap-y-3">
              <h1 className="font-sora text-24 font-semibold leading-tight">
                Anonymous Actions
              </h1>
              <p className="text-18 text-neutral-secondary leading-none">
                Lets you verify someone is a real person that has never
                performed an action before. Highest privacy level.
              </p>
            </section>
            <section className="grid gap-y-6">
              <div className="flex justify-between items-center">
                <div></div>
                <div className="grid grid-flow-col gap-x-8">
                  <Link
                    className="grid gap-x-1 grid-flow-col justify-start items-center px-3 py-2 border border-f3f4f5 rounded-lg hover:opacity-70 transition-opacity"
                    href="https://docs.worldcoin.org/id/anonymous-actions"
                    target="_blank"
                  >
                    <span>Docs</span>
                    <Icon name="arrow-right" className="w-4 h-4" />
                  </Link>
                  <Button
                    className="px-11 py-4"
                    onClick={() => setNewActionOpened(true)}
                  >
                    Create new
                  </Button>
                </div>
              </div>

              <div className="grid gap-y-4">
                {actions?.map((action) => (
                  <Action key={action.id} action={action} />
                ))}
              </div>
            </section>
          </div>
        </Fragment>
      )}
    </Layout>
  );
}
