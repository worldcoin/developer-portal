import { actionsLogic } from "logics/actionsLogic";
import { useActions, useValues } from "kea";
import { Layout } from "common/Layout";
import { ActionList } from "./ActionList";
import { Fragment, useEffect } from "react";
import { Preloader } from "common/Preloader";
import { NotFound } from "common/NotFound";
import { urls } from "urls";
import { appsLogic } from "logics/appsLogic";

export function Actions(): JSX.Element | null {
  const { actions, actionsLoading, listFilter } = useValues(actionsLogic);
  const { apps } = useValues(appsLogic);
  const { updateListFilter } = useActions(actionsLogic);

  useEffect(() => {
    if (listFilter.app_id) {
      updateListFilter({ ...listFilter, app_id: null });
    }
  }, [listFilter, updateListFilter]);

  return (
    <Layout title="Actions">
      {actionsLoading && (
        <div className="w-full h-full flex justify-center items-center">
          <Preloader className="w-20 h-20" />
        </div>
      )}

      {!actionsLoading && (
        <Fragment>
          {apps.length === 0 && actions.length === 0 ? (
            <NotFound
              icon="actions-empty"
              heading="You don't have any actions yet"
              description="It's time to create your first action!"
              linkLabel={"Create new action"}
              link={urls.actionNew()}
            />
          ) : (
            <ActionList />
          )}
        </Fragment>
      )}
    </Layout>
  );
}
