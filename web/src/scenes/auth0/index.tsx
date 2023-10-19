import { yupResolver } from "@hookform/resolvers/yup";
import { useRouter } from "next/router";
import { memo, useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { Button } from "src/components/Button";
import { Dialog } from "src/components/Dialog";
import { DialogHeader } from "src/components/DialogHeader";
import { FieldError } from "src/components/FieldError";
import { FieldGroup } from "src/components/FieldGroup";
import { FieldInput } from "src/components/FieldInput";
import { useToggle } from "src/hooks/useToggle";
import * as yup from "yup";

const emailSchema = yup.object({
  email: yup
    .string()
    .email("Please, enter valid email")
    .required("This field is required"),
});

const otpSchema = yup.object({
  otp: yup.string().required(),
});

type EmailFormData = yup.InferType<typeof emailSchema>;
type OtpFormData = yup.InferType<typeof otpSchema>;

export const Auth0 = memo(function Auth0() {
  const emailDialog = useToggle(true);
  const otpDialog = useToggle(false);

  const router = useRouter();

  const {
    register: emailFormRegister,
    handleSubmit: emailFormHandleSubmit,
    formState: emailFormState,
    getValues: getEmailFormValues,
  } = useForm<EmailFormData>({
    resolver: yupResolver(emailSchema),
    mode: "onChange",
  });

  const {
    register: otpFormRegister,
    handleSubmit: otpFormHandleSubmit,
    formState: otpFormState,
  } = useForm<OtpFormData>({
    resolver: yupResolver(otpSchema),
    mode: "onChange",
  });

  const submitEmail = useCallback(
    async (values: EmailFormData) => {
      const res = await fetch("/api/auth/send-otp", {
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
        body: JSON.stringify(values),
      });

      if (!res.ok) {
        return toast.error("Error occurred while sending OTP.");
      }

      const result = await res.json();

      if (result.success) {
        emailDialog.toggleOff();
        otpDialog.toggleOn();
      }
    },
    [emailDialog, otpDialog]
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
    <div className="min-h-screen grid">
      <Dialog open={emailDialog.isOn}>
        <DialogHeader title="Enter email" />

        <form
          className="grid gap-y-4"
          onSubmit={emailFormHandleSubmit(submitEmail)}
        >
          <FieldGroup label="Email">
            <FieldInput
              type="email"
              {...emailFormRegister("email")}
              placeholder="Enter e-mail address"
            />
            {emailFormState.errors.email?.message && (
              <FieldError message={emailFormState.errors.email?.message} />
            )}
          </FieldGroup>

          <Button
            type="submit"
            className="py-4"
            disabled={
              !emailFormState.isValid ||
              emailFormState.isSubmitting ||
              !emailFormState.dirtyFields.email
            }
          >
            {emailFormState.isSubmitting ? "Sending..." : "Send OTP"}
          </Button>
        </form>
      </Dialog>

      <Dialog open={otpDialog.isOn}>
        <DialogHeader title="Enter One-Time Password" />

        <form
          className="grid gap-y-4"
          onSubmit={otpFormHandleSubmit(submitOtp)}
        >
          <FieldGroup label="One-Time Password">
            <FieldInput
              type="text"
              {...otpFormRegister("otp")}
              placeholder="OTP"
            />
            {otpFormState.errors.otp?.message && (
              <FieldError message={otpFormState.errors.otp?.message} />
            )}
          </FieldGroup>

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
      </Dialog>
    </div>
  );
});
