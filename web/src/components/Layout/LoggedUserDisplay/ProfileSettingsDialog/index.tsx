import { FieldError } from "@/components/FieldError";
import { memo } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { Illustration } from "src/components/Auth/Illustration";
import { Button } from "src/components/Button";
import { Dialog } from "src/components/Dialog";
import { DialogHeader } from "src/components/DialogHeader";
import { FieldInput } from "src/components/FieldInput";
import { FieldLabel } from "src/components/FieldLabel";
// import { ImageInput } from "src/components/Layout/common/ImageInput";
import { FetchUserQuery } from "../graphql/fetch-user.generated";
import { useUpdateUser } from "../hooks/user-hooks";

type FormData = {
  name: string;
  email: string;
  imageUrl?: string;
};

export interface ProfileSettingsDialogProps {
  open: boolean;
  onClose: () => void;
  user?: FetchUserQuery["user"][number];
}

export const ProfileSettingsDialog = memo(function ProfileSettingsDialog(
  props: ProfileSettingsDialogProps
) {
  const { updateUser } = useUpdateUser(props.user?.id ?? "");

  const { control, register, reset, handleSubmit, formState } =
    useForm<FormData>({
      values: {
        name: props.user?.name ?? "",
        email: props.user?.email ?? "",
        //FIXME: add user image field to hasura
        imageUrl: "",
      },
    });

  const onSubmit = handleSubmit(async (data) => {
    if (!props.user) {
      return toast.error("Error occurred while saving profile.");
    }

    try {
      await updateUser({
        variables: {
          id: props.user?.id,
          userData: { email: data.email, name: data.name },
        },
      });

      props.onClose();
    } catch (error) {
      toast.error("Error occurred while saving profile.");
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
              render={() => (
                <Illustration icon="user" />

                // FIXME implement image upload
                // <ImageInput
                //   icon="user"
                //   imageUrl={field.value}
                //   onImageUrlChange={field.onChange}
                //   disabled={formState.isSubmitting}
                // />
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
