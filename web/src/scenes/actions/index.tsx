import { Layout } from "@/components/Layout";
import { Action } from "./Action";
import { Button } from "@/components/Button";
import { Link } from "@/components/Link";
import { Icon } from "@/components/Icon";
import { NewAction } from "./NewAction";
import { IActionStore, useActionStore } from "src/stores/actionStore";
import useApps from "src/hooks/useApps";
import { Preloader } from "src/components/Preloader";
import { Fragment, useMemo } from "react";
import { NotFound } from "@/components/NotFound";
import { useFetchActions } from "./hooks";
import { useForm, useWatch } from "react-hook-form";

const getActionsStore = (store: IActionStore) => ({
  setNewActionOpened: store.setIsNewActionModalOpened,
});

export function Actions(props: { user_id?: string }): JSX.Element | null {
  const { currentApp, isLoading: appIsLoading } = useApps();
  const { actions, isActionsLoading } = useFetchActions();
  const { setNewActionOpened } = useActionStore(getActionsStore);

  const { register, control } = useForm<{ actionSearch: string }>({
    mode: "onChange",
  });

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
    <Layout
      title="Actions"
      userId={props.user_id}
      mainClassName="grid items-start"
    >
      {(appIsLoading || isActionsLoading) && (
        <div className="w-full h-full flex justify-center items-center">
          <Preloader className="w-20 h-20" />
        </div>
      )}

      {!appIsLoading && !currentApp && <NotFound className="self-center" />}

      {!appIsLoading && !isActionsLoading && currentApp && (
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
            <section className="relative flex gap-x-8 p-8 bg-f9fafb border border-ebecef rounded-xl">
              <div className="flex items-center justify-center w-16 h-16 bg-ffffff border border-f3f4f5 rounded-full">
                <Icon name="notepad" className="h-6 w-6 text-primary" />
              </div>
              <div className="grid gap-y-1">
                <h2 className="font-sora text-16 font-semibold leading-5">
                  Private and one-time actions
                </h2>
                <p className="max-w-[543px] text-14 text-657080 leading-4">
                  &quot;Anonymous Actions&quot; generates zero-knowledge proof
                  for each action.
                </p>
                <p className="max-w-[543px] text-14 text-657080 leading-4">
                  It verifies that a person is doing an action only once and
                  ensures unlinkable actions for enhanced privacy, as in voting
                  applications.
                </p>
              </div>
              <Link
                className="absolute top-4 right-4 flex items-center gap-x-1 h-9 px-4 text-14 bg-ffffff border border-ebecef rounded-lg hover:opacity-70 transition-opacity"
                href="https://docs.worldcoin.org/id/anonymous-actions"
                target="_blank"
              >
                Learn more
                <Icon name="arrow-right" className="w-4 h-4" />
              </Link>
            </section>

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
                  <table className="w-full">
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
                            <div className="font-medium text-12 leading-3">
                              List of Anonymous Actions
                            </div>
                            <div className="mt-2 text-12 text-657080 leading-3">
                              No active actions yet.
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
