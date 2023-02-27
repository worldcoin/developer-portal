import { Layout } from "common/Layout";
import { NotFound } from "common/NotFound";
import { Preloader } from "common/Preloader";
import { useValues } from "kea";
import { appsLogic } from "logics/appsLogic";
import { authLogic } from "logics/authLogic";
import { Fragment, memo, useState } from "react";
import { urls } from "urls";
import { Appslist } from "./AppsList";
import { Dialog } from "common/Dialog";
import { DialogHeader } from "common/DialogHeader";
import { FieldInput } from "common/FieldInput";
import { FieldLabel } from "common/FieldLabel";
import { Button } from "common/Button";
import { AuthRequired } from "common/AuthRequired";

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

        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
          <DialogHeader icon="apps" title="Create New App" />
          <div>
            <div className="flex flex-col gap-y-2">
              <FieldLabel required>Name</FieldLabel>
              <FieldInput
                className="w-full"
                placeholder="Add apps name"
                required
              />
            </div>
            <div className="mt-6 flex flex-col gap-y-2">
              <FieldLabel>Description</FieldLabel>
              {/* FIXME: use textarea instead of input */}
              <FieldInput className="w-full" placeholder="Add description" />
            </div>
            <Button className="w-full h-[56px] mt-12 font-medium">
              Create New App
            </Button>
          </div>
        </Dialog>
      </Layout>
    </AuthRequired>
  );
});
