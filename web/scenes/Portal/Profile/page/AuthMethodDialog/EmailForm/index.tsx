import { CircleIconContainer } from "@/components/CircleIconContainer";
import { DecoratedButton } from "@/components/DecoratedButton";
import { UserAddIcon } from "@/components/Icons/UserAddIcon";
import { Input } from "@/components/Input";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { useMeQuery } from "@/scenes/common/me-query/client";
import { FetchMeDocument } from "@/scenes/common/me-query/client/graphql/client/me-query.generated";
import { yupResolver } from "@hookform/resolvers/yup";
import { useAtom } from "jotai";
import { useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import * as yup from "yup";
import { authMethodDialogAtom } from "..";
import { useAddEmailToUserMutation } from "./graphql/client/add-email-to-user.generated";
import { sendVerificationEmail } from "./send-verification-email";
import { verifyEmailWithOTP } from "./verify-email-with-otp";

const emailSchema = yup.object({
  email: yup.string().email().required(),
});

const otpSchema = yup.object({
  otp: yup.string().required(),
});

export type EmailFormValues = yup.InferType<typeof emailSchema>;
export type OTPFormValues = yup.InferType<typeof otpSchema>;

export const EmailForm = () => {
  const [emailSent, setEmailSent] = useState(false);
  const [, setIsOpened] = useAtom(authMethodDialogAtom);
  const { user } = useMeQuery();

  const [addEmail] = useAddEmailToUserMutation({
    refetchQueries: [FetchMeDocument],
  });

  const {
    handleSubmit: handleEmailSubmit,
    register: emailRegister,
    formState: {
      errors: emailErrors,
      isSubmitting: isEmailSubmitting,
      isDirty: isEmailDirty,
    },
    getValues: getEmailFormValues,
  } = useForm<EmailFormValues>({
    resolver: yupResolver(emailSchema),
    mode: "onChange",
  });

  const {
    handleSubmit: handleOtpSubmit,
    register: otpRegister,
    formState: {
      errors: otpErrors,
      isSubmitting: isOtpSubmitting,
      isDirty: isOtpDirty,
    },
  } = useForm<OTPFormValues>({
    resolver: yupResolver(otpSchema),
    mode: "onChange",
  });

  const sendEmail = useCallback(async (values: EmailFormValues) => {
    try {
      await sendVerificationEmail({ email: values.email });
    } catch (error) {
      return toast.error("Error while sending email");
    }

    toast.success("Email sent!");
    setEmailSent(true);
  }, []);

  const verifyOtp = useCallback(
    async (values: OTPFormValues) => {
      if (!user.id) {
        return;
      }

      const email = getEmailFormValues().email;
      try {
        await verifyEmailWithOTP({ email: email, otp: values.otp });
        await addEmail({ variables: { id: user.id, email } });
      } catch (error) {
        toast.error("Error while verifying OTP");
      }

      setIsOpened(false);
      toast.success("Email verified successfully");
    },
    [addEmail, getEmailFormValues, setIsOpened, user.id],
  );

  return (
    <div className="grid w-full gap-y-8">
      <CircleIconContainer variant="info" className="justify-self-center">
        <UserAddIcon />
      </CircleIconContainer>

      <div className="grid gap-y-4">
        <Typography variant={TYPOGRAPHY.H6} className="justify-self-center">
          Connect email
        </Typography>

        {!emailSent && (
          <form
            className="grid w-full gap-y-4"
            onSubmit={handleEmailSubmit(sendEmail)}
          >
            <Input
              register={emailRegister("email")}
              type="email"
              label="Email"
              errors={emailErrors.email}
            />
            <DecoratedButton
              type="submit"
              disabled={
                isEmailSubmitting || Boolean(emailErrors.email) || !isEmailDirty
              }
              className="mt-2 py-3"
            >
              Send email
            </DecoratedButton>
          </form>
        )}

        {emailSent && (
          <form
            className="grid w-full gap-y-4"
            onSubmit={handleOtpSubmit(verifyOtp)}
          >
            <Input
              register={otpRegister("otp")}
              errors={otpErrors.otp}
              type="text"
              label="OTP"
            />
            <DecoratedButton
              type="submit"
              disabled={
                isOtpSubmitting || Boolean(otpErrors.otp) || !isOtpDirty
              }
              className="mt-2 py-3"
            >
              Verify
            </DecoratedButton>
          </form>
        )}
      </div>
    </div>
  );
};
