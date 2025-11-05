"use client";
import { DecoratedButton } from "@/components/DecoratedButton";
import { IdentificationIcon } from "@/components/Icons/IdentificationIcon";
import { MailWithLines } from "@/components/Icons/MailWithLines";
import { SpinnerIcon } from "@/components/Icons/SpinnerIcon";
import { IconFrame } from "@/components/InitialSteps/IconFrame";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { AffiliateMetadataResponse } from "@/lib/types";
import { AcceptTerms } from "./AcceptTerms";
import { useMemo, useState } from "react";
import {
  getIdentityVerificationLink,
  GetIdentityVerificationLinkResponse,
} from "@/scenes/Portal/Teams/TeamId/Team/AffiliateProgram/Overview/server/getIdentityVerificationLink";
import { toast } from "react-toastify";

type Props = {
  data: AffiliateMetadataResponse;
};

export const NotVerified = (props: Props) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showAcceptTerms, setShowAcceptTerms] = useState(false);

  const title = useMemo(() => {
    if (!isLoading) {
      return props.data.verificationType === "kyb"
        ? "Complete KYB"
        : "Complete KYC";
    }
    return props.data.verificationType === "kyb"
      ? "KYB processing"
      : "KYC processing";
  }, [props.data.verificationType, isLoading]);

  const description = useMemo(() => {
    if (!isLoading) {
      return "To unlock affiliate program";
    }
    return "It can take 1-3 days";
  }, [isLoading]);

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
        <IconFrame className="bg-blue-500 text-grey-0">
          <IdentificationIcon />
        </IconFrame>

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
            Complete
          </DecoratedButton>
        )}
      </div>
    </div>
  );
};
