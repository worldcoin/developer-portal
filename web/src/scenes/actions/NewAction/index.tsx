import { Button } from "@/components/Button";
import { Dialog } from "@/components/Dialog";
import { DialogHeader } from "@/components/DialogHeader";
import { FieldInput } from "@/components/FieldInput";
import { FieldLabel } from "@/components/FieldLabel";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { Illustration } from "src/components/Auth/Illustration";
import { FieldTextArea } from "src/components/FieldTextArea";
import useActions from "src/hooks/useActions";
import { IActionStore, useActionStore } from "src/stores/actionStore";

const getActionsStore = (store: IActionStore) => ({
  isOpened: store.isNewActionModalOpened,
  setIsOpened: store.setIsNewActionModalOpened,
  newAction: store.newAction,
  setNewAction: store.setNewAction,
});

export function NewAction() {
  const [isReady, setIsReady] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const { createNewAction, isNewActionMutating, isNewActionDuplicateAction } =
    useActions();

  const { newAction, setNewAction, isOpened, setIsOpened } =
    useActionStore(getActionsStore);

  const handleActionNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewAction({ name: e.target.value });

    const action = e.target.value.toLowerCase().replace(/[^a-z0-9]/g, "-");
    if (!newAction.action || newAction.action !== action) {
      setNewAction({ action });
    }
  };

  const handleMaxVerificationsChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (parseInt(e.target.value) >= 0) {
      setNewAction({ maxVerifications: parseInt(e.target.value) });
    } else {
      setNewAction({ maxVerifications: 0 });
    }
  };

  const handleSubmit = useCallback(
    (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (e.currentTarget.checkValidity()) {
        createNewAction();
      }
    },
    [createNewAction]
  );

  useEffect(() => {
    if (
      newAction.name &&
      newAction.action &&
      newAction.maxVerifications !== null &&
      newAction.maxVerifications >= 0
    ) {
      setIsReady(true);
    } else {
      setIsReady(false);
    }
  }, [newAction.action, newAction.maxVerifications, newAction.name]);

  return (
    <Dialog open={isOpened} onClose={() => setIsOpened(false)}>
      <DialogHeader
        icon={<Illustration icon="notepad" />}
        title="Create New Action"
      />
      <form onSubmit={handleSubmit} ref={formRef}>
        <div className="flex flex-col gap-y-2">
          <FieldLabel className="font-rubik" required>
            Name
          </FieldLabel>

          <FieldInput
            className="w-full font-rubik"
            placeholder="Add name"
            required
            value={newAction.name}
            onChange={handleActionNameChange}
            disabled={isNewActionMutating}
          />
        </div>

        <div className="mt-6 flex flex-col gap-y-2">
          <FieldLabel className="font-rubik">Description</FieldLabel>

          <FieldTextArea
            className="w-full font-rubik"
            placeholder="This is what users will see in the World App."
            value={newAction.description}
            onChange={(e) => setNewAction({ description: e.target.value })}
            disabled={isNewActionMutating}
          />
        </div>

        <div className="mt-6 flex flex-col gap-y-2">
          <FieldLabel required className="font-rubik">
            Action identifier
          </FieldLabel>

          <FieldInput
            className="w-full font-rubik"
            placeholder="This is the value you need to pass to IDKit"
            required
            value={newAction.action}
            onChange={(e) => setNewAction({ action: e.target.value })}
            invalid={isNewActionDuplicateAction}
            disabled={isNewActionMutating}
          />
        </div>

        <div className="mt-6 flex flex-col gap-y-2">
          <FieldLabel required className="font-rubik">
            Maximum verifications
          </FieldLabel>

          <FieldInput
            className="w-full font-rubik"
            placeholder="Use '0' for unlimited verifications"
            required
            value={newAction.maxVerifications?.toString()}
            onChange={handleMaxVerificationsChange}
            disabled={isNewActionMutating}
          />
        </div>

        <Button
          className="w-full h-[56px] mt-12 font-medium"
          disabled={isNewActionMutating || !isReady}
        >
          Create New Action
        </Button>
      </form>
    </Dialog>
  );
}
