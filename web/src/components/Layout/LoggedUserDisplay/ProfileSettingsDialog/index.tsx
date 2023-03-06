import { memo } from "react";
import { DialogHeader } from "src/components/DialogHeader";
import { FieldLabel } from "src/components/FieldLabel";
import { FieldInput } from "src/components/FieldInput";
import { Button } from "src/components/Button";
import { Dialog } from "src/components/Dialog";
import { ImageInput } from "src/components/Layout/common/ImageInput";
import { useForm, Controller } from "react-hook-form";
import { FieldError } from "@/components/FieldError";

type FormData = {
  name: string;
  email: string;
  imageUrl?: string;
};

export interface ProfileSettingsDialogProps {
  open: boolean;
  onClose: () => void;
}

export const ProfileSettingsDialog = memo(function ProfileSettingsDialog(
  props: ProfileSettingsDialogProps
) {
  const { control, register, reset, handleSubmit, formState } =
    useForm<FormData>({
      // FIXME: this values must be fetched from the server and passed as props
      // values: {
      //   name: "John Doe",
      //   email: "example@example",
      //   imageUrl: "https://fastly.picsum.photos/id/40/88/88.jpg?hmac=XQ7fH1YgKvAv7BEJcBsiF7qmuOaVhlbYHHeT-8nTnuM",
      // }
    });

  const onSubmit = handleSubmit(async (data) => {
    //TODO: add saving profile logic
    console.log(data);
    try {
      await new Promise((res, rej) =>
        setTimeout(() => {
          Math.random() > 0.5 ? res({}) : rej(Error("saving error"));
        }, 3000)
      );
      console.log("saved");
      reset();
    } catch (error) {
      console.error(error);
      reset(data);
    }
  });

  return (
    <Dialog open={props.open} onClose={props.onClose}>
      <form onSubmit={onSubmit}>
        <DialogHeader
          title="Profile Settings"
          icon={
            <Controller
              name="imageUrl"
              control={control}
              render={({ field }) => (
                <ImageInput
                  icon="user"
                  imageUrl={field.value}
                  onImageUrlChange={field.onChange}
                  disabled={formState.isSubmitting}
                />
              )}
            />
          }
        />

        <div>
          <div className="flex flex-col gap-y-2">
            <FieldLabel className="font-rubik" required>
              Your Name
            </FieldLabel>

            <FieldInput
              className="w-full font-rubik"
              type="text"
              {...register("name", { required: true })}
              readOnly={formState.isSubmitting}
              invalid={!!formState.errors.name}
            />

            {/* TODO: display possible errors here */}
            {!!formState.errors.name && <FieldError message="Error!" />}
          </div>

          <div className="mt-6 flex flex-col gap-y-2">
            <FieldLabel className="font-rubik" required>
              Email
            </FieldLabel>

            <FieldInput
              className="w-full font-rubik"
              type="email"
              {...register("email", {
                required: true,
                pattern: /^\S+@\S+\.\S+$/,
              })}
              readOnly={formState.isSubmitting}
              invalid={!!formState.errors.email}
            />

            {/* TODO: display possible errors here */}
            {!!formState.errors.email && <FieldError message="Error!" />}
          </div>

          <Button
            className="w-full h-[56px] mt-12 font-medium"
            type="submit"
            disabled={formState.isSubmitting}
          >
            Save Changes
          </Button>
        </div>
      </form>
    </Dialog>
  );
});
