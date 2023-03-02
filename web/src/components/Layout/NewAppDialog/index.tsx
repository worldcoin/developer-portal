import { memo, useCallback, useMemo, useState } from "react";
import { DialogHeader } from "src/components/DialogHeader";
import { FieldLabel } from "src/components/FieldLabel";
import { FieldInput } from "src/components/FieldInput";
import { Button } from "src/components/Button";
import { Dialog } from "src/components/Dialog";
import { EngineSwitch } from "./EngineSwitch";
import { ImageInput } from "../common/ImageInput";

export interface NewAppDialogProps {
  open: boolean;
  onClose: () => void;
}

export const NewAppDialog = memo(function NewAppDialog(
  props: NewAppDialogProps
) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [engine, setEngine] = useState<"cloud" | "on-chain">("cloud");

  const submit = useCallback(() => {
    //TODO: add saving profile logic
    console.log({ name, description, engine });
  }, [description, engine, name]);

  const isFormValid = useMemo(() => {
    return name.length > 0 && description.length > 0;
  }, [description.length, name.length]);

  return (
    <Dialog open={props.open} onClose={props.onClose}>
      <DialogHeader title="Create New App" icon={<ImageInput icon="apps" />} />

      <div>
        <div className="flex flex-col gap-y-2">
          <FieldLabel className="font-rubik" required>
            Name
          </FieldLabel>

          <FieldInput
            className="w-full font-rubik"
            placeholder="Add your app name (visible to users)"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="mt-6 flex flex-col gap-y-2">
          <FieldLabel className="font-rubik">Description</FieldLabel>
          {/* FIXME: use textarea instead of input */}
          <FieldInput
            className="w-full font-rubik"
            placeholder="Add something helpful that will help you and your teammates identify your app. This is only visible to your team."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <EngineSwitch value={engine} onChange={setEngine} />

        <Button
          onClick={submit}
          disabled={!isFormValid}
          className="w-full h-[56px] mt-12 font-medium"
        >
          Create New App
        </Button>
      </div>
    </Dialog>
  );
});
