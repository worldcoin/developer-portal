"use client";
import { MailWithLines } from "@/components/Icons/MailWithLines";
import { SizingWrapper } from "@/components/SizingWrapper";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import {
  GetIdentityVerificationLinkResponse,
  ParticipationStatus,
} from "@/lib/types";
import { useGetAffiliateMetadata } from "@/scenes/Portal/Teams/TeamId/Team/AffiliateProgram/Overview/page/hooks/use-get-affiliate-metadata";
import { getIdentityVerificationLink } from "@/scenes/Portal/Teams/TeamId/Team/AffiliateProgram/Overview/server/getIdentityVerificationLink";
import { useState } from "react";
import { toast } from "react-toastify";
import { AcceptTermsDialog } from "./AcceptTerms";
import { RequestStep } from "./RequestStep";
import { KybStep } from "./KybStep";

export const VerifyPage = () => {
  const { data: metadata, refetch: refetchMetadata } =
    useGetAffiliateMetadata();
  const [isLoading, setIsLoading] = useState(false);
  const [showAcceptTerms, setShowAcceptTerms] = useState(false);

  const handleGetVerificationLink = async () => {
    if (!metadata) return;

    setShowAcceptTerms(false);
    setIsLoading(true);

    try {
      const result = await getIdentityVerificationLink({
        redirectUri: window.location.href.replace("/verify", ""),
      });
      console.log("getIdentityVerificationLink: ", result);

      if (result.success && result.data) {
        // Navigate to verification link
        window.location.href = (
          result.data as GetIdentityVerificationLinkResponse
        ).result.link;
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

  const handleComplete = () => {
    if (metadata?.termsAcceptedAt) {
      handleGetVerificationLink();
      return;
    }
    setShowAcceptTerms(true);
  };

  return (
    <SizingWrapper
      gridClassName="order-2 grow"
      className="flex flex-col place-content-center items-center"
      variant="nav"
    >
      <AcceptTermsDialog
        open={showAcceptTerms}
        onConfirm={handleGetVerificationLink}
        onClose={() => setShowAcceptTerms(false)}
      />

      <div className="grid max-w-[480px] grid-cols-1 justify-items-center pt-12">
        <MailWithLines className="md:max-w-[380px]" />

        <div className="mt-4 grid gap-y-2 text-center">
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

        <div className="mt-10">
          <RequestStep
            metadata={metadata}
            onComplete={() => {
              refetchMetadata();
            }}
          />

          <KybStep
            metadata={metadata}
            onComplete={handleComplete}
            isLoading={isLoading}
          />
        </div>
      </div>
    </SizingWrapper>
  );
};
