import { FieldError } from "@/components/FieldError";
import { memo, useCallback } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { Illustration } from "src/components/Auth/Illustration";
import { Dialog } from "src/components/Dialog";
import { DialogHeader } from "src/components/DialogHeader";
import { FieldInput } from "src/components/FieldInput";
import { FieldLabel } from "src/components/FieldLabel";
// import { ImageInput } from "src/components/Layout/common/ImageInput";
import { FetchUserQuery } from "../graphql/fetch-user.generated";
import { useFetchUser, useUpdateUser } from "../hooks/user-hooks";
import { useUser } from "@auth0/nextjs-auth0/client";
import { Link } from "src/components/Link";
import { Button } from "src/components/Button";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { updateSession } from "@auth0/nextjs-auth0";
import { useRouter } from "next/router";
import { urls } from "src/lib/urls";

const userDataSchema = yup.object({
  name: yup.string().required("This field is required"),
  imageUrl: yup.string(),
});

const emailSchema = yup.object({
  email: yup
    .string()
    .email("Please, enter valid email")
    .required("This field is required"),
});

type UserDataForm = yup.InferType<typeof userDataSchema>;
type EmailForm = yup.InferType<typeof emailSchema>;

export interface ProfileSettingsDialogProps {
  open: boolean;
  onClose: () => void;
  user?: ReturnType<typeof useFetchUser>["user"];
}

export const ProfileSettingsDialog = memo(function ProfileSettingsDialog(
  props: ProfileSettingsDialogProps
) {
  const router = useRouter();
  const { updateUser } = useUpdateUser(props.user?.hasura.id ?? "");

  const {
    control: userDataControl,
    register: userDataRegister,
    reset: userDataReset,
    handleSubmit: handleUserDataSubmit,
    formState: userDataFormState,
  } = useForm<UserDataForm>({
    values: {
      name: props.user?.hasura.name ?? "",
      //FIXME: add user image field to hasura
      imageUrl: "",
    },

    resolver: yupResolver(userDataSchema),
  });

  const {
    handleSubmit: handleEmailSubmit,
    register: emailRegister,
    formState: emailFormState,
  } = useForm<EmailForm>({
    values: {
      email: props.user?.auth0User.user?.email ?? "",
    },

    resolver: yupResolver(emailSchema),
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
        userDataReset(data);
      }
    },
    [props, updateUser, userDataReset]
  );

  const submitEmail = useCallback(
    async (data: EmailForm) => {
      const res = await fetch("/api/auth/update-email", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          id: props.user?.auth0User.isSessionData
            ? props.user?.auth0User.user?.sub
            : props.user?.auth0User.user?.user_id,
          email: data.email,
        }),
      });

      if (!res.ok) {
        return toast.error("Error occurred while saving email.");
      }

      router.push(urls.logout());
    },
    [
      props.user?.auth0User.isSessionData,
      props.user?.auth0User.user?.sub,
      props.user?.auth0User.user?.user_id,
      router,
    ]
  );

  return (
    <Dialog open={props.open} onClose={props.onClose}>
      <form onSubmit={handleUserDataSubmit(submitUserData)}>
        <DialogHeader
          title="Profile Settings"
          icon={
            <Controller
              name="imageUrl"
              control={userDataControl}
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
              {...userDataRegister("name")}
              readOnly={userDataFormState.isSubmitting}
              invalid={!!userDataFormState.errors.name}
            />

            {/* TODO: display possible errors here */}
            {!!userDataFormState.errors.name && (
              <FieldError message={userDataFormState.errors.name.message} />
            )}
          </div>

          <Button
            className="w-full h-[56px] mt-4 font-medium"
            type="submit"
            disabled={userDataFormState.isSubmitting}
          >
            Save Name
          </Button>
        </div>
      </form>

      <form onSubmit={handleEmailSubmit(submitEmail)}>
        <div className="mt-6 flex flex-col gap-y-2">
          <div className="grid gap-y-1">
            <FieldLabel className="font-rubik" required>
              Email
            </FieldLabel>

            <span className="text-12 text-657080">
              This will allow you to log in using email
            </span>
          </div>

          {props.user?.auth0User?.user?.email && (
            <FieldInput
              className="w-full font-rubik"
              type="email"
              {...emailRegister("email")}
            />
          )}

          {/* TODO: display possible errors here */}
          {!!emailFormState.errors.email && (
            <FieldError message={emailFormState.errors.email.message} />
          )}
        </div>

        {props.user?.hasura.auth0Id &&
          !props.user?.auth0User.user?.email_verified && (
            <div className="grid gap-y-2 mt-2">
              <span className="text-danger text-12">
                Please, log in again with email to verify
              </span>

              <Button variant="danger" className="h-[56px]">
                <Link href={urls.logout()}>Logout</Link>
              </Button>
            </div>
          )}

        {props.user?.auth0User.user?.email && (
          <Button className="w-full h-[56px] mt-4 font-medium" type="submit">
            Update email
          </Button>
        )}
      </form>

      {!props.user?.auth0User?.user?.email && (
        <Button className="w-full h-[56px] mt-4 font-medium" type="button">
          <Link
            href={`/api/auth/login?id=${props.user?.hasura?.id}`}
            className="w-full h-full flex justify-center items-center"
          >
            Connect Email
          </Link>
        </Button>
      )}
    </Dialog>
  );
});
