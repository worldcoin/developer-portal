import { Layout } from "@/components/Layout";
import { Action } from "./Action";
import { Button } from "@/components/Button";
import { Icon } from "@/components/Icon";
import { NewAction } from "./NewAction";
import { IActionStore, useActionStore } from "src/stores/actionStore";
import useApps from "src/hooks/useApps";
import { Preloader } from "src/components/Preloader";
import { Fragment, useMemo } from "react";
import { NotFound } from "@/components/NotFound";
import { useFetchActions } from "./hooks";
import { useForm, useWatch } from "react-hook-form";
import { PageInfo } from "@/components/PageInfo";
import { UpdateAction } from "./UpdateAction";
import { useToggle } from "src/hooks/useToggle";
import { DeleteAction } from "./DeleteAction";

const getActionsStore = (store: IActionStore) => ({
  setNewActionOpened: store.setIsNewActionModalOpened,
});

export function Actions(): JSX.Element | null {
  const { currentApp, isLoading: appIsLoading } = useApps();
  const { actions, isActionsLoading } = useFetchActions();
  const { setNewActionOpened } = useActionStore(getActionsStore);

  const { register, control } = useForm<{ actionSearch: string }>({
    mode: "onChange",
  });

  const updateActionModal = useToggle();

  const actionsSearch = useWatch({
    control,
    name: "actionSearch",
  });

  const actionsToRender = useMemo(() => {
    if (!actions) {
      return [];
    }

    if (!actionsSearch) {
      return actions;
    }

    const fieldsToSearch = ["name", "description", "action"] as const;

    return actions.filter((action) => {
      return fieldsToSearch.some((field) => {
        return action[field]
          ?.toLowerCase()
          .includes(actionsSearch.toLowerCase());
      });
    });
  }, [actions, actionsSearch]);

  return (
    <Layout title="Actions" mainClassName="grid items-start">
      {(appIsLoading || isActionsLoading) && (
        <div className="w-full h-full flex justify-center items-center">
          <Preloader className="w-20 h-20" />
        </div>
      )}

      {!appIsLoading && !currentApp && <NotFound className="self-center" />}

      {!appIsLoading && !isActionsLoading && currentApp && (
        <Fragment>
          <NewAction />
          <UpdateAction />
          <DeleteAction />

          <div className="grid gap-y-12">
            <div className="grid gap-y-6">
              <h1 className="font-sora text-24 font-semibold leading-tight">
                Anonymous Actions
              </h1>
              <PageInfo
                icon="notepad"
                iconClassName="text-primary"
                title="Anonymous Actions"
                text={[
                  "Anonymous Actions allow users to verify that they're a unique person without revealing their identity.",
                  "Actions are independent from each other, preventing two separate actions from being linked to the same user.",
                  "You can also limit how many times a user can perform any given action to prevent sybil attacks.",
                ]}
                linkText="Tech Docs"
                linkHref="https://docs.worldcoin.org/id/anonymous-actions"
              />
            </div>

            <section className="grid gap-y-2">
              <div className="flex items-center gap-x-2">
                <div className="font-medium text-14 leading-4">
                  Anonymous Actions
                </div>
                <div className="flex items-center h-5 px-1.5 font-sora text-12 text-657080 leading-4 bg-ebecef rounded">
                  {actions?.length ?? 0}
                </div>
              </div>

              <div className="p-4 rounded-xl shadow-card">
                <div className="flex items-center gap-x-8">
                  <label className="grow flex items-center gap-x-4 h-12 px-4 border border-ebecef rounded-lg">
                    <Icon name="search" className="w-6 h-6 text-d6d9dd" />
                    <input
                      {...register("actionSearch")}
                      className="grow font-rubik text-14 outline-none placeholder:text-d6d9dd"
                      placeholder="Search for an action..."
                    />
                  </label>
                  <Button
                    className="h-12 px-11"
                    onClick={() => setNewActionOpened(true)}
                  >
                    Create New Action
                  </Button>
                </div>
                <div>
                  <table className="w-full max-w-full">
                    <thead>
                      <tr>
                        <th className="w-1/4 pt-8 pb-4 pr-6 whitespace-nowrap text-12 text-left border-b border-f3f4f5">
                          Action Name
                        </th>
                        <th className="w-full pt-8 pb-4 pr-6 whitespace-nowrap text-12 text-left border-b border-f3f4f5">
                          Description
                        </th>
                        <th className="pt-8 pb-4 pr-4 whitespace-nowrap text-12 text-left border-b border-f3f4f5">
                          Verifications per person
                        </th>
                        <th className="pt-8 pb-4 whitespace-nowrap text-12 text-center border-b border-f3f4f5">
                          Unique persons
                        </th>
                        <th className="pt-8 pb-4 whitespace-nowrap border-b border-f3f4f5" />
                      </tr>
                    </thead>
                    {actions && actions?.length === 0 && (
                      <tbody>
                        <tr>
                          <td className="pt-8 pb-4 text-center" colSpan={5}>
                            <div className="relative h-[182px] flex flex-col items-center justify-center bg-center bg-[url('/images/empty-actions.svg')]">
                              <Icon name="notepad" className="w-6 h-6" />
                              <div className="mt-4 font-sora font-semibold text-14 leading-4">
                                This app has no anonymous actions yet
                              </div>
                              <div className="mt-1.5 text-12 text-657080 leading-4">
                                You can create your anonymous actions here or
                                with IDKit.
                              </div>
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    )}
                    {actionsToRender &&
                      actionsToRender?.length > 0 &&
                      actionsToRender.map((action) => (
                        <Fragment key={action.id}>
                          <tbody>
                            <tr>
                              <td className="h-4" />
                            </tr>
                          </tbody>
                          <Action action={action} />
                        </Fragment>
                      ))}
                  </table>
                </div>
              </div>
            </section>
          </div>
        </Fragment>
      )}
    </Layout>
  );
}
