"use client";
import { DecoratedButton } from "@/components/DecoratedButton";
import { OtpInput } from "@/components/OtpInput";
import { Typography, TYPOGRAPHY } from "@/components/Typography";
import { Auth0SessionUser } from "@/lib/types";
import { useUser } from "@auth0/nextjs-auth0/client";
import { useCallback, useState } from "react";
import { useFormContext } from "react-hook-form";
import { toast } from "react-toastify";
import { WithdrawFormData } from "../common/types";

export type Props = {
  onConfirm: () => void;
  onRetry: () => void;
  isLoading: boolean; // Add this prop
};

const MAX_RETRY_ATTEMPTS = 3;

export const EnterCode = (props: Props) => {
  const { user } = useUser() as Auth0SessionUser;
  const { onRetry, isLoading } = props;

  // Retry state management
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  // Use form context from parent
  const {
    formState: { errors },
    watch,
    setValue,
  } = useFormContext<WithdrawFormData>();

  const otpCode = watch("otpCode");

  // Check if OTP code is valid
  const isOtpValid = otpCode && !errors.otpCode;

  const handleOtpChange = useCallback(
    (value: string) => {
      setValue("otpCode", value, {
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true,
      });
    },
    [setValue],
  );

  const handleRetry = useCallback(async () => {
    if (retryCount >= MAX_RETRY_ATTEMPTS) {
      toast.error("Maximum retry attempts reached");
      return;
    }

    setIsRetrying(true);
    try {
      // Call the parent's onSubmit function
      await onRetry();
      setRetryCount((prev) => prev + 1);
      toast.success("New OTP code is sent");
    } catch (error) {
      console.error("Retry failed:", error);
      toast.error("Failed to resend code. Please try again.");
    } finally {
      setIsRetrying(false);
    }
  }, [onRetry, retryCount]);

  return (
    <div className="grid w-full max-w-[380px] place-items-center justify-self-center py-8">
      <Typography variant={TYPOGRAPHY.H5}>Check email template</Typography>

      <Typography
        variant={TYPOGRAPHY.R4}
        className="mt-2 w-full text-center text-gray-500"
      >
        We sent confirmation code to {user?.email}.
      </Typography>

      <div className="my-10">
        <OtpInput
          value={otpCode || ""}
          onChange={handleOtpChange}
          error={errors.otpCode}
        />
      </div>

      <DecoratedButton
        type="button"
        variant="primary"
        className="w-full"
        disabled={!isOtpValid || isLoading}
        onClick={props.onConfirm}
      >
        Confirm
      </DecoratedButton>

      <Typography variant={TYPOGRAPHY.R4} className="mt-6 text-center">
        {retryCount < MAX_RETRY_ATTEMPTS ? (
          <>
            Didn't receive the code?{" "}
            <button
              type="button"
              className="cursor-pointer underline"
              onClick={handleRetry}
              disabled={isRetrying || isLoading}
            >
              Resend
            </button>
            {retryCount > 0 &&
              ` (${retryCount}/${MAX_RETRY_ATTEMPTS} attempts)`}
          </>
        ) : (
          "Maximum retry attempts reached. Please contact support if you need assistance."
        )}
      </Typography>
    </div>
  );
};
