import { Button } from "@/components/Button";
import { DecoratedButton } from "@/components/DecoratedButton";
import { Typography, TYPOGRAPHY } from "@/components/Typography";
import { ReactNode, useMemo } from "react";
import {
  AffiliateMetadataResponse,
  IdentityVerificationStatus,
} from "@/lib/types";
import { IconFrame } from "@/components/InitialSteps/IconFrame";
import { RemoveCustomIcon } from "@/components/Icons/RemoveCustomIcon";
import { IdentificationIcon } from "@/components/Icons/IdentificationIcon";
import { SpinnerIcon } from "@/components/Icons/SpinnerIcon";
import { ArrowDownSharpIcon } from "@/components/Icons/ArrowDownSharp";

type StepConfig = {
  icon?: ReactNode;
  title: string;
  description?: string;
  buttonTxt?: string;
  onClick?: () => void;
  loading?: boolean;
};

type Props = {
  metadata: AffiliateMetadataResponse["result"];
  isLoading: boolean;
  onComplete: () => void;
};

export const KybStep = ({ metadata, isLoading, onComplete }: Props) => {
  const requestConfig: StepConfig | null = useMemo(() => {
    if (!metadata) return null;

    const status = metadata.identityVerificationStatus;

    if (status === IdentityVerificationStatus.SUCCESS) {
      return null;
    }

    if (status === IdentityVerificationStatus.PENDING) {
      return {
        title: "KYB processing",
        description: "It can take 1-3 days",
        loading: true,
      };
    }

    if (status === IdentityVerificationStatus.FAILED) {
      return {
        title: "KYB failed",
        description: "Verification failed, try again",
        buttonTxt: "Try again",
      };
    }

    // fallback for undefined || not_started || created || timeout - Complete KYB
    return {
      title: "Complete KYB",
      description: "To unlock affiliate program",
      buttonTxt: "Complete",
    };
  }, [metadata]);

  return (
    <>
      {metadata?.identityVerificationStatus ===
      IdentityVerificationStatus.FAILED ? (
        <IconFrame className="flex-shrink-0 bg-system-error-50 text-system-error-500">
          <RemoveCustomIcon className="size-5" />
        </IconFrame>
      ) : (
        <IconFrame className="flex-shrink-0 bg-blue-500 text-grey-0">
          <IdentificationIcon className="size-5" />
        </IconFrame>
      )}

      <div className="text-start">
        <Typography as="p" variant={TYPOGRAPHY.M3}>
          {requestConfig?.title}
        </Typography>
        <Typography as="p" variant={TYPOGRAPHY.R5} className="text-grey-500">
          {requestConfig?.description}
        </Typography>
      </div>
      {requestConfig?.loading ? (
        <SpinnerIcon className="ml-auto size-6 animate-spin" />
      ) : (
        <>
          <Button
            type="button"
            onClick={onComplete}
            className="ml-auto flex size-6 items-center justify-center rounded-full bg-grey-900 md:hidden"
          >
            <ArrowDownSharpIcon className="size-3 text-grey-0" />
          </Button>
          <DecoratedButton
            type="button"
            onClick={onComplete}
            className="ml-auto hidden md:block"
          >
            {requestConfig?.buttonTxt}
          </DecoratedButton>
        </>
      )}
    </>
  );
};
