import { FieldError } from "@/components/FieldError";
import { memo, useCallback, useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { Illustration } from "src/components/Auth/Illustration";
import { Dialog } from "src/components/Dialog";
import { DialogHeader } from "src/components/DialogHeader";
import { FieldInput } from "src/components/FieldInput";
import { FieldLabel } from "src/components/FieldLabel";
// import { ImageInput } from "src/components/Layout/common/ImageInput";
import { useFetchUser, useUpdateUser } from "../hooks/user-hooks";
import { Button } from "src/components/Button";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";

const userDataSchema = yup.object({
  name: yup.string().required("This field is required"),
  imageUrl: yup.string(),
});

type UserDataForm = yup.InferType<typeof userDataSchema>;

export interface ProfileSettingsDialogProps {
  open: boolean;
  onClose: () => void;
  user?: ReturnType<typeof useFetchUser>["user"];
}

export const ProfileSettingsDialog = memo(function ProfileSettingsDialog(
  props: ProfileSettingsDialogProps
) {
  const { updateUser } = useUpdateUser(props.user?.hasura.id ?? "");

  const { control, register, reset, handleSubmit, formState } =
    useForm<UserDataForm>({
      values: {
        name: props.user?.hasura.name ?? "",
        //FIXME: add user image field to hasura
        imageUrl: "",
      },

      resolver: yupResolver(userDataSchema),
    });

  const submitUserData = useCallback(
    async (data: UserDataForm) => {
      if (!props.user?.hasura || !props.user?.hasura.id) {
        return toast.error("Error occurred while saving profile.");
      }

      try {
        await updateUser({
          variables: {
            id: props.user.hasura.id,
            userData: { name: data.name },
          },
        });

        props.onClose();
      } catch (error) {
        toast.error("Error occurred while saving profile.");
        reset(data);
      }
    },
    [props, updateUser, reset]
  );

  return (
    <Dialog open={props.open} onClose={props.onClose}>
      <form onSubmit={handleSubmit(submitUserData)}>
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
              {...register("name")}
              readOnly={formState.isSubmitting}
              invalid={!!formState.errors.name}
            />

            {/* TODO: display possible errors here */}
            {!!formState.errors.name && (
              <FieldError message={formState.errors.name.message} />
            )}
          </div>

          <Button
            className="w-full h-[56px] mt-4 font-medium"
            type="submit"
            disabled={formState.isSubmitting}
          >
            Save Name
          </Button>
        </div>
      </form>
    </Dialog>
  );
});
