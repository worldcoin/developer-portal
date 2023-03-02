import { AuthRequired } from "common/AuthRequired";
import { Button } from "common/Button";
import { Link } from "common/components/Link";
import { Dialog } from "common/Dialog";
import { DialogHeader } from "common/DialogHeader";
import { FieldInput } from "common/FieldInput";
import { FieldLabel } from "common/FieldLabel";
import { useToggle } from "common/hooks";
import { Icon } from "common/Icon";
import { Layout } from "common/Layout";
import { useEffect, useState } from "react";
import { getActionStore, useActionStore } from "stores/actionStore";
import { AppType, getAppStore, useAppStore } from "stores/appStore";
import { Action } from "./Action";

export function Actions(): JSX.Element | null {
  const dialog = useToggle();
  const { currentApp } = useAppStore(getAppStore);
  const { actions, fetchCustomActions } = useActionStore(getActionStore);
  const [prevApp, setPrevApp] = useState<AppType | null>(null);

  useEffect(() => {
    if (currentApp && prevApp !== currentApp) {
      fetchCustomActions(currentApp.id);
      setPrevApp(currentApp);
    }
  }, [currentApp, fetchCustomActions, prevApp]);

  return (
    <AuthRequired>
      <Layout title="Actions">
        <Dialog open={dialog.isOn} onClose={dialog.toggleOff}>
          <DialogHeader icon="notepad" title="Create New Action" />
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

            <div className="mt-6 flex flex-col gap-y-2">
              <FieldLabel>Action</FieldLabel>
              <FieldInput className="w-full" placeholder="Add action" />
            </div>

            <div className="mt-6 flex flex-col gap-y-2">
              <FieldLabel>App ID</FieldLabel>
              <FieldInput className="w-full" placeholder="Add App ID" />
            </div>

            <Button className="w-full h-[56px] mt-12 font-medium">
              Create New Action
            </Button>
          </div>
        </Dialog>

        <div className="grid gap-y-12">
          <section className="grid gap-y-3">
            <h1 className="font-sora text-24 font-semibold leading-tight">
              Custom Actions
            </h1>
            <p className="text-18 text-neutral-secondary leading-none">
              Prove unique humanness for unique actions within your application.
            </p>
          </section>

          <section className="grid gap-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="font-sora text-20 font-semibold">
                  Custom Actions
                </h2>
                <p className="text-14 text-neutral-secondary">
                  Prove unique humanness for unique actions within your
                  application.
                </p>
              </div>

              <div className="grid grid-flow-col gap-x-8">
                <Link
                  className="grid gap-x-1 grid-flow-col justify-start items-center px-3 py-2 border border-f3f4f5 rounded-lg"
                  href="https://docs.worldcoin.org/"
                >
                  <span>Docs</span>
                  <Icon name="arrow-right" className="w-4 h-4" />
                </Link>

                <Button className="px-11 py-4" onClick={dialog.toggleOn}>
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
      </Layout>
    </AuthRequired>
  );
}
