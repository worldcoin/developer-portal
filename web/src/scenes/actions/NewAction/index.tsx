import { Dialog } from "@/components/Dialog";
import { Button } from "@/components/Button";
import { DialogHeader } from "@/components/DialogHeader";
import { FieldInput } from "@/components/FieldInput";
import { FieldLabel } from "@/components/FieldLabel";
import { Illustration } from "src/components/Auth/Illustration";
import { FormEvent, useCallback, useState } from "react";
import { FieldTextArea } from "src/components/FieldTextArea";

export type NewActionFormData = {
  name: string;
  description?: string;
  action?: string;
  app_id?: string;
};

interface NewActionProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: NewActionFormData) => void;
}

export function NewAction(props: NewActionProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState<string | undefined>();
  const [action, setAction] = useState<string | undefined>();
  const [appId, setAppId] = useState<string | undefined>();

  const handleSubmit = useCallback(
    (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (e.currentTarget.checkValidity()) {
        props.onSubmit({
          name,
          description,
          action,
          app_id: appId,
        });
      }
    },
    [action, appId, description, name, props]
  );

  return (
    <Dialog open={props.open} onClose={props.onClose}>
      <DialogHeader
        icon={<Illustration icon="notepad" />}
        title="Create New Action"
      />
      <form onSubmit={handleSubmit}>
        <div className="flex flex-col gap-y-2">
          <FieldLabel required>Name</FieldLabel>

          <FieldInput
            className="w-full"
            placeholder="Add name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="mt-6 flex flex-col gap-y-2">
          <FieldLabel>Description</FieldLabel>

          <FieldTextArea
            className="w-full"
            placeholder="Add description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="mt-6 flex flex-col gap-y-2">
          <FieldLabel>Action</FieldLabel>

          <FieldInput
            className="w-full"
            placeholder="Add action"
            value={action}
            onChange={(e) => setAction(e.target.value)}
          />
        </div>

        <div className="mt-6 flex flex-col gap-y-2">
          <FieldLabel>App ID</FieldLabel>

          <FieldInput
            className="w-full"
            placeholder="Add App ID"
            value={appId}
            onChange={(e) => setAppId(e.target.value)}
          />
        </div>

        <Button className="w-full h-[56px] mt-12 font-medium">
          Create New Action
        </Button>
      </form>
    </Dialog>
  );
}
