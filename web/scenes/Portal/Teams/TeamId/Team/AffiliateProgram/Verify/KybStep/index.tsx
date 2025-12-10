import { ReactNode, useMemo } from "react";
import {
  AffiliateMetadataResponse,
  IdentityVerificationStatus,
  ParticipationStatus,
} from "@/lib/types";
import { IconFrame } from "@/components/InitialSteps/IconFrame";
import { RemoveCustomIcon } from "@/components/Icons/RemoveCustomIcon";
import { IdentificationIcon } from "@/components/Icons/IdentificationIcon";
import { Step } from "@/scenes/Portal/Teams/TeamId/Team/AffiliateProgram/Verify/Step";

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
  const requestConfig: StepConfig | null = useMemo(() => {
    if (!metadata) return null;

    const status = metadata.identityVerificationStatus;
    const defaultConfig = {
      icon: (
        <IconFrame className="flex-shrink-0 bg-blue-500 text-grey-0">
          <IdentificationIcon className="size-5" />
        </IconFrame>
      ),
    };

    if (metadata.participationStatus !== ParticipationStatus.APPROVED) {
      return {
        ...defaultConfig,
        icon: (
          <IconFrame className="flex-shrink-0 bg-grey-100 text-grey-500">
            <IdentificationIcon className="size-5" />
          </IconFrame>
        ),
        title: "Complete KYB",
        disabled: true,
      };
    }

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
      icon={requestConfig?.icon}
      title={requestConfig?.title}
      description={requestConfig?.description}
      buttonText={requestConfig?.buttonTxt}
      showButtonSpinner={requestConfig?.loading || isLoading}
      loading={!requestConfig}
      onClick={onComplete}
      disabled={requestConfig?.disabled}
    />
  );
};
