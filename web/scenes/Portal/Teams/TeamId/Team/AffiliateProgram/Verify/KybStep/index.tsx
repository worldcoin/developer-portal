import { BusinessIcon } from "@/components/Icons/BusinessIcon";
import { IdentificationIcon } from "@/components/Icons/IdentificationIcon";
import { RemoveCustomIcon } from "@/components/Icons/RemoveCustomIcon";
import { IconFrame } from "@/components/InitialSteps/IconFrame";
import { IdentityVerificationStatus } from "@/lib/types";
import { Step } from "@/scenes/Portal/Teams/TeamId/Team/AffiliateProgram/Verify/Step";
import { ReactNode, useMemo } from "react";

type StepConfig = {
  icon?: ReactNode;
  title: string;
  description?: string;
  buttonTxt?: string;
  onClick?: () => void;
  loading?: boolean;
  disabled?: boolean;
};

type Props = {
  verificationType: "kyc" | "kyb";
  status: IdentityVerificationStatus;
  onComplete: () => void;
  isLoading: boolean;
  buttonText?: string;
  className?: string;
};

export const VerificationStep = ({
  verificationType,
  status,
  onComplete,
  isLoading,
  buttonText,
  className,
}: Props) => {
  const stepConfig: StepConfig | null = useMemo(() => {
    const verificationTypeUpper = verificationType.toUpperCase();
    const isKyb = verificationType === "kyb";
    const completeTitle = `Complete ${verificationTypeUpper}`;

    const defaultConfig = {
      icon: (
        <IconFrame className="shrink-0 bg-blue-500 text-grey-0">
          {isKyb ? (
            <BusinessIcon className="size-5" />
          ) : (
            <IdentificationIcon className="size-5" />
          )}
        </IconFrame>
      ),
    };

    if (status === IdentityVerificationStatus.SUCCESS) {
      return null;
    }

    if (status === IdentityVerificationStatus.PENDING) {
      return {
        ...defaultConfig,
        title: `${verificationTypeUpper} processing`,
        description: "It can take 1-3 days",
        loading: true,
      };
    }

    if (status === IdentityVerificationStatus.FAILED) {
      return {
        ...defaultConfig,
        icon: (
          <IconFrame className="shrink-0 bg-system-error-50 text-system-error-500">
            <RemoveCustomIcon className="size-5" />
          </IconFrame>
        ),
        title: `${verificationTypeUpper} failed`,
        buttonTxt: "Try again",
        description: "Verification failed, try again",
      };
    }

    // fallback for undefined || not_started || created || timeout
    return {
      ...defaultConfig,
      title: completeTitle,
      buttonTxt: buttonText ?? "Complete",
    };
  }, [buttonText, status, verificationType]);

  if (!stepConfig) {
    return null;
  }

  return (
    <Step
      icon={stepConfig.icon}
      title={stepConfig.title}
      description={stepConfig.description}
      buttonText={stepConfig.buttonTxt}
      showButtonSpinner={stepConfig.loading || isLoading}
      loading={false}
      onClick={onComplete}
      disabled={stepConfig.disabled}
      className={className}
    />
  );
};
