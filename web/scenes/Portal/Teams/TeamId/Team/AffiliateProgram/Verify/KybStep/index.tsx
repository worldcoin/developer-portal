import { IdentificationIcon } from "@/components/Icons/IdentificationIcon";
import { RemoveCustomIcon } from "@/components/Icons/RemoveCustomIcon";
import { IconFrame } from "@/components/InitialSteps/IconFrame";
import {
  AffiliateMetadataResponse,
  IdentityVerificationStatus,
} from "@/lib/types";
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
  metadata: AffiliateMetadataResponse["result"] | null;
  onComplete: () => void;
  isLoading: boolean;
};

export const KybStep = ({ metadata, onComplete, isLoading }: Props) => {
  const stepConfig: StepConfig | null = useMemo(() => {
    if (!metadata) return null;

    const status = metadata.identityVerificationStatus;
    const defaultConfig = {
      icon: (
        <IconFrame className="flex-shrink-0 bg-blue-500 text-grey-0">
          <IdentificationIcon className="size-5" />
        </IconFrame>
      ),
    };

    if (status === IdentityVerificationStatus.SUCCESS) {
      return null;
    }

    if (status === IdentityVerificationStatus.PENDING) {
      return {
        ...defaultConfig,
        title: "KYB processing",
        description: "It can take 1-3 days",
        loading: true,
      };
    }

    if (status === IdentityVerificationStatus.FAILED) {
      return {
        ...defaultConfig,
        icon: (
          <IconFrame className="flex-shrink-0 bg-system-error-50 text-system-error-500">
            <RemoveCustomIcon className="size-5" />
          </IconFrame>
        ),
        title: "KYB failed",
        buttonTxt: "Try again",
      };
    }

    // fallback for undefined || not_started || created || timeout - Complete KYB
    return {
      ...defaultConfig,
      title: "Complete KYB",
      buttonTxt: "Complete",
    };
  }, [metadata]);

  return (
    <Step
      icon={stepConfig?.icon}
      title={stepConfig?.title}
      description={stepConfig?.description}
      buttonText={stepConfig?.buttonTxt}
      showButtonSpinner={stepConfig?.loading || isLoading}
      loading={!stepConfig}
      onClick={onComplete}
      disabled={stepConfig?.disabled}
    />
  );
};
