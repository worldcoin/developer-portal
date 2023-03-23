import { Dialog } from "@/components/Dialog";
import { Button } from "@/components/Button";
import { DialogHeader } from "@/components/DialogHeader";
import { FieldInput } from "@/components/FieldInput";
import { FieldLabel } from "@/components/FieldLabel";
import { Illustration } from "src/components/Auth/Illustration";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
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
  const formRef = useRef<HTMLFormElement>(null);
  const { createNewAction, isNewActionMutating, isNewActionDuplicateAction } =
    useActions();

  const { newAction, setNewAction, isOpened, setIsOpened } =
    useActionStore(getActionsStore);

  const handleSubmit = useCallback(
    (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (e.currentTarget.checkValidity()) {
        createNewAction();
      }
    },
    [createNewAction]
  );

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
            onChange={(e) => setNewAction({ name: e.target.value })}
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

        <Button
          className="w-full h-[56px] mt-12 font-medium"
          disabled={isNewActionMutating}
        >
          Create New Action
        </Button>
      </form>
    </Dialog>
  );
}
