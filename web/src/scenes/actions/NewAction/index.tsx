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
  isOpened: store.newIsOpened,
  setIsOpened: store.setNewIsOpened,
  newAction: store.newAction,
  setNewAction: store.setNewAction,
});

export function NewAction() {
  const formRef = useRef<HTMLFormElement>(null);
  const { createNewAction } = useActions();
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
          <FieldLabel required>Name</FieldLabel>

          <FieldInput
            className="w-full"
            placeholder="Add name"
            required
            value={newAction.name}
            onChange={(e) => setNewAction({ name: e.target.value })}
          />
        </div>

        <div className="mt-6 flex flex-col gap-y-2">
          <FieldLabel>Description</FieldLabel>

          <FieldTextArea
            className="w-full"
            placeholder="Add description"
            value={newAction.description}
            onChange={(e) => setNewAction({ description: e.target.value })}
          />
        </div>

        <div className="mt-6 flex flex-col gap-y-2">
          <FieldLabel required>Action</FieldLabel>

          <FieldInput
            className="w-full"
            placeholder="Add action"
            required
            value={newAction.action}
            onChange={(e) => setNewAction({ action: e.target.value })}
          />
        </div>

        <div className="mt-6 flex flex-col gap-y-2">
          <FieldLabel>App ID</FieldLabel>

          <FieldInput
            className="w-full"
            placeholder="Add App ID"
            value={newAction.app_id}
            onChange={(e) => setNewAction({ app_id: e.target.value })}
          />
        </div>

        <Button className="w-full h-[56px] mt-12 font-medium">
          Create New Action
        </Button>
      </form>
    </Dialog>
  );
}
