import { memo, useState } from "react";
import { DialogHeader } from "common/DialogHeader";
import { FieldLabel } from "common/FieldLabel";
import { FieldInput } from "common/FieldInput";
import { Button } from "common/Button";
import { Dialog } from "common/Dialog";
import { ImageInput } from "scenes/apps/CreateAppDialog/ImageInput";
import { EngineSwitch } from "scenes/apps/CreateAppDialog/EngineSwitch";

export interface CreateAppDialogProps {
  open: boolean;
  onClose: () => void;
}

export const CreateAppDialog = memo(function CreateAppDialog(
  props: CreateAppDialogProps
) {
  const [engine, setEngine] = useState<"cloud" | "on-chain">("cloud");

  return (
    <Dialog open={props.open} onClose={props.onClose}>
      <DialogHeader title="Create New App" icon={<ImageInput />} />

      <div>
        <div className="flex flex-col gap-y-2">
          <FieldLabel required>Name</FieldLabel>

          <FieldInput className="w-full" placeholder="Add apps name" required />
        </div>

        <div className="mt-6 flex flex-col gap-y-2">
          <FieldLabel>Description</FieldLabel>
          {/* FIXME: use textarea instead of input */}
          <FieldInput className="w-full" placeholder="Add description" />
        </div>

        <EngineSwitch value={engine} onChange={setEngine} />

        <Button className="w-full h-[56px] mt-12 font-medium">
          Create New App
        </Button>
      </div>
    </Dialog>
  );
});
