import { AuthRequired } from "src/components/AuthRequired";
import { Button } from "src/components/Button";
import { Dialog } from "src/components/Dialog";
import { DialogHeader } from "src/components/DialogHeader";
import { FieldInput } from "src/components/FieldInput";
import { FieldLabel } from "src/components/FieldLabel";
import { Layout } from "src/components/Layout";
import { memo, useState } from "react";

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
