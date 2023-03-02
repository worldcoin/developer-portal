import { memo } from "react";
import { Dialog } from "src/components/Dialog";
import { DialogHeader } from "src/components/DialogHeader";
import { FieldInput } from "src/components/FieldInput";
import { FieldLabel } from "src/components/FieldLabel";
import { Button } from "src/components/Button";

export const NewAppDialog = memo(function NewAppDialog(props: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <Dialog open={props.open} onClose={props.onClose}>
      <DialogHeader icon="apps" title="Create New App" />
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
        <Button className="w-full h-[56px] mt-12 font-medium">
          Create New App
        </Button>
      </div>
    </Dialog>
  );
});
