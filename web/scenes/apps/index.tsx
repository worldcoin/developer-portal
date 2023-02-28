import { Layout } from "common/Layout";
import { NotFound } from "common/NotFound";
import { Preloader } from "common/Preloader";
import { useValues } from "kea";
import { appsLogic } from "logics/appsLogic";
import { authLogic } from "logics/authLogic";
import { Fragment, memo, useState } from "react";
import { urls } from "urls";
import { Appslist } from "./AppsList";
import { AuthRequired } from "common/AuthRequired";
import { CreateAppDialog } from "scenes/apps/CreateAppDialog";

export const Apps = memo(function Apps() {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <AuthRequired>
      <Layout>
        {/* {userLoading && (
        <div className="w-full h-full flex justify-center items-center">
          <Preloader className="w-20 h-20" />
        </div>
      )}

      {!userLoading && (
        <Fragment>
          {apps.length ? (
            <Appslist />
          ) : (
            <NotFound
              icon="actions-empty"
              heading="You don't have any apps yet"
              description="It's time to create your first app!"
              link={urls.appNew()}
              linkLabel="Create new app"
            />
          )}
        </Fragment>
      )} */}

        <button className="p-3 border" onClick={() => setDialogOpen(true)}>
          CREATE NEW APP
        </button>

        <CreateAppDialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
        />
      </Layout>
    </AuthRequired>
  );
});
