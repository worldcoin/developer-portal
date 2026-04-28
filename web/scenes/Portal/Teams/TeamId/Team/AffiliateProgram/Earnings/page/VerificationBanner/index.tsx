"use client";
import { CircleIconContainer } from "@/components/CircleIconContainer";
import { DecoratedButton } from "@/components/DecoratedButton";
import { IdentificationIcon } from "@/components/Icons/IdentificationIcon";
import { RemoveCustomIcon } from "@/components/Icons/RemoveCustomIcon";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { AffiliateMetadataResponse, IdentityVerificationStatus } from "@/lib/types";
import { useMemo } from "react";
import {ClockIcon} from "@/components/Icons/ClockIcon";

type Props = {
  onComplete: () => void;
  metadata: AffiliateMetadataResponse["result"];
};

export const VerificationBanner = ({
  onComplete,
  metadata,
}: Props) => {
  const stepConfig = useMemo(() => {
    const status = metadata.identityVerificationStatus;
    const verificationType = metadata.verificationType;
    const verificationTypeUpper = verificationType.toUpperCase();

    if (status === IdentityVerificationStatus.SUCCESS) {
      return null;
    }

    if (status === IdentityVerificationStatus.PENDING) {
      return {
        title: `${verificationTypeUpper} processing`,
        description: "Verification process can take 1-3 days",
        buttonText: "Show more",
        icon: <ClockIcon className="size-8 text-blue-500" />,
        iconVariant: "info" as const,
        containerClassName: "border-blue-150 from-blue-150/25",
      };
    }

    if (status === IdentityVerificationStatus.FAILED) {
      return {
        title: `${verificationTypeUpper} failed`,
        description: "Verification failed, please try again",
        buttonText: "Show more",
        icon: <RemoveCustomIcon className="size-8 text-system-error-600" />,
        iconVariant: "error" as const,
        containerClassName: "border-system-error-200 from-system-error-200/25",
      };
    }

    return {
      title: `Complete ${verificationTypeUpper}`,
      description: `Complete ${verificationTypeUpper} to unlock withdrawals`,
      buttonText: "Complete",
      icon: <IdentificationIcon className="size-8 text-blue-500" />,
      iconVariant: "info" as const,
      containerClassName: "border-blue-150 from-blue-150/25",
    };
  }, [metadata]);

  if (!stepConfig) {
    return null;
  }

  return (
    <div
      className={`flex items-center justify-between rounded-3xl border bg-gradient-to-t to-transparent p-5 md:mt-10 ${stepConfig.containerClassName}`}
    >
      <div className="flex items-center gap-4">
        <div className="flex size-[60px] items-center justify-center">
          <div className="scale-[0.6818]">
            <CircleIconContainer variant={stepConfig.iconVariant}>
              {stepConfig.icon}
            </CircleIconContainer>
          </div>
        </div>

        <div className="grid gap-y-1">
          <Typography variant={TYPOGRAPHY.H7}>{stepConfig.title}</Typography>
          <Typography variant={TYPOGRAPHY.R4} className="text-grey-500">
            {stepConfig.description}
          </Typography>
        </div>
      </div>
      <DecoratedButton type="button" className="max-h-9" onClick={onComplete}>
        {stepConfig.buttonText}
      </DecoratedButton>
    </div>
  );
};
