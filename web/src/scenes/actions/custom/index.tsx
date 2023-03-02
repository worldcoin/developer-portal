import { AuthRequired } from "src/components/AuthRequired";
import { Button } from "src/components/Button";
import { Link } from "src/components/components/Link";
import { Dialog } from "src/components/Dialog";
import { DialogHeader } from "src/components/DialogHeader";
import { FieldInput } from "src/components/FieldInput";
import { FieldLabel } from "src/components/FieldLabel";
import { useToggle } from "src/hooks/useToggle";
import { Icon } from "src/components/Icon";
import { Layout } from "src/components/Layout";
import { CustomAction } from "src/components/Layout/temp-data";
import { useEffect } from "react";
import { useActionStore } from "./store";
import { useAppStore } from "src/stores/appStore";
import { shallow } from "zustand/shallow";
import { Action } from "./Action";

export function Actions(props: {
  actions: Array<CustomAction>;
}): JSX.Element | null {
  const dialog = useToggle();

  const currentApp = useAppStore((store) => store.currentApp);

  const { actions, setActions, fetchActions } = useActionStore(
    (store) => ({ ...store }),
    shallow
  );

  useEffect(() => {
    fetchActions(currentApp?.id ?? "");
  }, [actions, currentApp?.id, fetchActions, setActions]);

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
