import { memo } from "react";
import { DialogHeader } from "common/DialogHeader";
import { FieldLabel } from "common/FieldLabel";
import { FieldInput } from "common/FieldInput";
import { Button } from "common/Button";
import { Dialog } from "common/Dialog";
import { ImageInput } from "./ImageInput";

export interface ProfileSettingsDialogProps {
  open: boolean;
  onClose: () => void;
}

export const ProfileSettingsDialog = memo(function ProfileSettingsDialog(
  props: ProfileSettingsDialogProps
) {
  return (
    <Dialog open={props.open} onClose={props.onClose}>
      <DialogHeader title="Profile Settings" icon={<ImageInput />} />

      <div>
        <div className="flex flex-col gap-y-2">
          <FieldLabel className="font-rubik" required>
            Your Name
          </FieldLabel>

          <FieldInput className="w-full font-rubik" required />
        </div>

        <div className="mt-6 flex flex-col gap-y-2">
          <FieldLabel className="font-rubik" required>
            Email
          </FieldLabel>

          <FieldInput className="w-full font-rubik" type="email" required />
        </div>

        <Button className="w-full h-[56px] mt-12 font-medium">
          Save Changes
        </Button>
      </div>
    </Dialog>
  );
});
