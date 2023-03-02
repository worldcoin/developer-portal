import { memo, useCallback, useMemo, useState } from "react";
import { DialogHeader } from "src/components/DialogHeader";
import { FieldLabel } from "src/components/FieldLabel";
import { FieldInput } from "src/components/FieldInput";
import { Button } from "src/components/Button";
import { Dialog } from "src/components/Dialog";
import { ImageInput } from "src/components/Layout/common/ImageInput";

export interface ProfileSettingsDialogProps {
  open: boolean;
  onClose: () => void;
}

export const ProfileSettingsDialog = memo(function ProfileSettingsDialog(
  props: ProfileSettingsDialogProps
) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [image, setImage] = useState("");

  const updateImage = useCallback((props: { dataURI?: string }) => {
    if (!props.dataURI) {
      return;
    }

    setImage(props.dataURI);
  }, []);

  const submit = useCallback(() => {
    //TODO: add saving profile logic
    console.log({ name, email, image });
  }, [email, image, name]);

  const isFormValid = useMemo(() => {
    const emailRegexp = /^\S+@\S+\.\S+$/;

    const isValid =
      name.length > 0 && email.length > 0 && emailRegexp.test(email);

    return isValid;
  }, [email, name.length]);

  return (
    <Dialog open={props.open} onClose={props.onClose}>
      <DialogHeader
        title="Profile Settings"
        icon={<ImageInput icon="user" setImage={updateImage} />}
      />

      <div>
        <div className="flex flex-col gap-y-2">
          <FieldLabel className="font-rubik" required>
            Your Name
          </FieldLabel>

          <FieldInput
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full font-rubik"
            required
          />
        </div>

        <div className="mt-6 flex flex-col gap-y-2">
          <FieldLabel className="font-rubik" required>
            Email
          </FieldLabel>

          <FieldInput
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full font-rubik"
            type="email"
            required
          />
        </div>

        <Button
          disabled={!isFormValid}
          onClick={submit}
          className="w-full h-[56px] mt-12 font-medium"
        >
          Save Changes
        </Button>
      </div>
    </Dialog>
  );
});
