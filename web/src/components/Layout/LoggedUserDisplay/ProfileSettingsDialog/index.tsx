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
import { Link } from "src/components/Link";
import { Button } from "src/components/Button";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { useRouter } from "next/router";
import { useToggle } from "src/hooks/useToggle";

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

const otpSchema = yup.object({
  otp: yup.string().required("This field is required"),
});

type UserDataForm = yup.InferType<typeof userDataSchema>;
type EmailForm = yup.InferType<typeof emailSchema>;
type OtpFormData = yup.InferType<typeof otpSchema>;

export interface ProfileSettingsDialogProps {
  open: boolean;
  onClose: () => void;
  user?: ReturnType<typeof useFetchUser>["user"];
}

export const ProfileSettingsDialog = memo(function ProfileSettingsDialog(
  props: ProfileSettingsDialogProps
) {
  const router = useRouter();
  const otpForm = useToggle(false);

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
    getValues: getEmailFormValues,
  } = useForm<EmailForm>({
    values: {
      email: props.user?.auth0?.email ?? "",
    },

    resolver: yupResolver(emailSchema),
  });

  const {
    register: otpFormRegister,
    handleSubmit: otpFormHandleSubmit,
    formState: otpFormState,
  } = useForm<OtpFormData>({
    resolver: yupResolver(otpSchema),
    mode: "onChange",
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

  const updateEmail = useCallback(
    async (data: EmailForm) => {
      const res = await fetch("/api/auth/update-email", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          id: props.user?.auth0.user_id,
          email: data.email,
        }),
      });

      if (!res.ok) {
        return toast.error("Error occurred while saving email.");
      }

      toast.success("Please, check your email to verify email");
      props.user?.auth0?.mutate();
      otpForm.toggleOn();
    },
    [otpForm, props.user?.auth0]
  );

  const submitOtp = useCallback(
    async (values: OtpFormData) => {
      const query = new URLSearchParams({
        email: getEmailFormValues().email,
        otp: values.otp,
      });

      router.push(`/api/auth/verify-otp?${query.toString()}`, undefined, {
        shallow: true,
      });
    },
    [getEmailFormValues, router]
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

      <form onSubmit={handleEmailSubmit(updateEmail)}>
        <div className="mt-6 flex flex-col gap-y-2">
          <div className="grid gap-y-1">
            <FieldLabel className="font-rubik" required>
              Email
            </FieldLabel>

            <span className="text-12 text-657080">
              This will allow you to log in using email
            </span>
          </div>

          {props.user?.auth0?.email && (
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

        {props.user?.hasura.auth0Id && !props.user?.auth0?.email_verified && (
          <span className="text-danger text-12">
            Email is not verified. Please, verify it before your next login.
          </span>
        )}

        {props.user?.auth0?.email && (
          <Button
            disabled={emailFormState.isSubmitting || !emailFormState.isDirty}
            className="w-full h-[56px] mt-4 font-medium"
            type="submit"
          >
            Update email
          </Button>
        )}
      </form>

      {otpForm.isOn && (
        <form
          className="grid gap-y-4 mt-6"
          onSubmit={otpFormHandleSubmit(submitOtp)}
        >
          <div className="w-full grid gap-y-1">
            <FieldLabel className="font-rubik" required>
              OTP
            </FieldLabel>

            <FieldInput
              type="text"
              {...otpFormRegister("otp")}
              placeholder="OTP"
              className="w-full"
            />
            {otpFormState.errors.otp?.message && (
              <FieldError message={otpFormState.errors.otp?.message} />
            )}
          </div>

          <Button
            type="submit"
            className="py-4"
            disabled={
              !otpFormState.isValid ||
              otpFormState.isSubmitting ||
              !otpFormState.dirtyFields.otp
            }
          >
            Verify
          </Button>
        </form>
      )}

      {!props.user?.auth0?.email && (
        <Button className="w-full h-[56px] mt-4 font-medium" type="button">
          <Link
            href="/api/auth/login"
            className="w-full h-full flex justify-center items-center"
          >
            Connect Email
          </Link>
        </Button>
      )}
    </Dialog>
  );
});
