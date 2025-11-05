"use client";
import { DecoratedButton } from "@/components/DecoratedButton";
import { IdentificationIcon } from "@/components/Icons/IdentificationIcon";
import { MailWithLines } from "@/components/Icons/MailWithLines";
import { RemoveCustomIcon } from "@/components/Icons/RemoveCustomIcon";
import { SpinnerIcon } from "@/components/Icons/SpinnerIcon";
import { IconFrame } from "@/components/InitialSteps/IconFrame";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import {
  AffiliateMetadataResponse,
  IdentityVerificationStatus,
} from "@/lib/types";
import {
  getIdentityVerificationLink,
  GetIdentityVerificationLinkResponse,
} from "@/scenes/Portal/Teams/TeamId/Team/AffiliateProgram/Overview/server/getIdentityVerificationLink";
import { useMemo, useState } from "react";
import { toast } from "react-toastify";
import { AcceptTerms } from "./AcceptTerms";

type Props = {
  data: AffiliateMetadataResponse;
};

export const NotVerified = (props: Props) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showAcceptTerms, setShowAcceptTerms] = useState(false);

  const title = useMemo(() => {
    const status = props.data.identityVerificationStatus;
    const type = props.data.verificationType === "kyb" ? "KYB" : "KYC";

    if (status === IdentityVerificationStatus.SUCCESS) {
      return null;
    }

    if (status === IdentityVerificationStatus.PENDING) {
      return `${type} processing`;
    }

    if (status === IdentityVerificationStatus.FAILED) {
      return `${type} failed`;
    }

    // fallback for undefined || not_started || created || timeout - Complete KYB
    return `Complete ${type}`;
  }, [props.data.identityVerificationStatus, props.data.verificationType]);

  const description = useMemo(() => {
    const status = props.data.identityVerificationStatus;

    if (status === IdentityVerificationStatus.SUCCESS) {
      return null;
    }

    if (status === IdentityVerificationStatus.PENDING) {
      return "It can take 1-3 days";
    }

    if (status === IdentityVerificationStatus.FAILED) {
      return "Verification failed, try again";
    }

    // fallback for undefined || not_started || created || timeout - Complete KYB
    return "To unlock affiliate program";
  }, [props.data.identityVerificationStatus]);

  const actionButton = useMemo(() => {
    return props.data.identityVerificationStatus ===
      IdentityVerificationStatus.FAILED
      ? "Try again"
      : "Complete";
  }, [props.data.identityVerificationStatus]);

  const handleCompleteKyb = async () => {
    setShowAcceptTerms(false);
    setIsLoading(true);

    try {
      const result = await getIdentityVerificationLink({
        type: props.data.verificationType,
        redirectUri: window.location.origin,
      });

      if (result.success && result.data) {
        // Navigate to verification link
        window.location.href = (
          result.data as GetIdentityVerificationLinkResponse
        ).link;
      } else {
        throw new Error(result.message || "Failed to get verification link");
      }
    } catch (error) {
      console.error("Failed to get verification link:", error);
      toast.error("Failed to start verification. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (showAcceptTerms) {
    return <AcceptTerms loading={isLoading} onConfirm={handleCompleteKyb} />;
  }

  return (
    <div className="grid max-w-[480px] grid-cols-1 justify-items-center pt-12">
      <MailWithLines className="md:max-w-[380px]" />

      <div className="mt-4 grid justify-items-center gap-y-2 ">
        <Typography variant={TYPOGRAPHY.H6}>
          Invite humans and earn rewards
        </Typography>

        <Typography
          variant={TYPOGRAPHY.R4}
          className="text-center text-grey-500"
        >
          Receive rewards for each human that uses your code and gets verified
        </Typography>
      </div>

      <div className="mt-6 flex w-full items-center gap-3 rounded-2xl border border-grey-200 p-6 md:mt-10">
        {props.data.identityVerificationStatus ===
        IdentityVerificationStatus.FAILED ? (
          <IconFrame className="bg-system-error-50 text-system-error-500">
            <RemoveCustomIcon className="size-5" />
          </IconFrame>
        ) : (
          <IconFrame className="bg-blue-500 text-grey-0">
            <IdentificationIcon className="size-5" />
          </IconFrame>
        )}

        <div className="text-start">
          <Typography as="p" variant={TYPOGRAPHY.M3}>
            {title}
          </Typography>
          <Typography as="p" variant={TYPOGRAPHY.R5} className="text-grey-500">
            {description}
          </Typography>
        </div>
        {isLoading ? (
          <SpinnerIcon className="ml-auto size-6 animate-spin" />
        ) : (
          <DecoratedButton
            type="button"
            onClick={() => setShowAcceptTerms(true)}
            className="ml-auto h-9"
          >
            {actionButton}
          </DecoratedButton>
        )}
      </div>
    </div>
  );
};
