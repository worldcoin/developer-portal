"use client";
import { DecoratedButton } from "@/components/DecoratedButton";
import { MailWithLines } from "@/components/Icons/MailWithLines";
import { SizingWrapper } from "@/components/SizingWrapper";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { GetIdentityVerificationLinkResponse } from "@/lib/types";
import { urls } from "@/lib/urls";
import { useGetAffiliateMetadata } from "@/scenes/Portal/Teams/TeamId/Team/AffiliateProgram/Overview/page/hooks/use-get-affiliate-metadata";
import { getIdentityVerificationLink } from "@/scenes/Portal/Teams/TeamId/Team/AffiliateProgram/Overview/server/getIdentityVerificationLink";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "react-toastify";
import { AcceptTermsDialog } from "./AcceptTerms";
import { SelectVerificationDialog } from "./SelectVerificationDialog";
import { VerifyLaterDialog } from "./VerifyLaterDialog";

export const VerifyPage = () => {
  const { data: metadata } = useGetAffiliateMetadata();
  const params = useParams();
  const teamId = params.teamId as string;
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showAcceptTerms, setShowAcceptTerms] = useState(false);
  const [showVerificationSelection, setShowVerificationSelection] =
    useState(false);
  const [showVerifyLaterDialog, setShowVerifyLaterDialog] = useState(false);

  const handleGetVerificationLink = async (type: "kyc" | "kyb") => {
    if (!metadata) return;

    setIsLoading(true);

    try {
      const result = await getIdentityVerificationLink({
        type,
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
        onConfirm={() => setShowVerificationSelection(true)}
        onClose={() => {
          setShowAcceptTerms(false);
        }}
      />
      <SelectVerificationDialog
        open={showVerificationSelection}
        onClose={() => {
          setShowVerificationSelection(false);
        }}
        onSelect={handleGetVerificationLink}
        isLoading={isLoading}
      />
      <VerifyLaterDialog
        open={showVerifyLaterDialog}
        onClose={() => setShowVerifyLaterDialog(false)}
        onConfirm={() => {
          setShowVerifyLaterDialog(false);
          router.push(urls.affiliateProgram({ team_id: teamId }));
        }}
        onVerifyNow={() => {
          setShowVerifyLaterDialog(false);
          setShowAcceptTerms(true);
        }}
        isLoading={isLoading}
      />

      <div className="grid w-full max-w-[480px] grid-cols-1 justify-items-center gap-y-10">
        <MailWithLines className="w-full max-w-[382px]" />

        <div className="grid gap-y-3 text-center">
          <Typography variant={TYPOGRAPHY.H6} className="w-full">
            Invite humans and earn rewards
          </Typography>
          <Typography variant={TYPOGRAPHY.R3} className="text-grey-500">
            Receive rewards for each human that uses your
            <br />
            code and gets verified.
          </Typography>
        </div>

        <div className="grid w-full justify-items-center gap-y-4">
          <DecoratedButton
            type="button"
            className="h-12 w-[360px] rounded-[10px]"
            onClick={handleComplete}
            disabled={isLoading}
          >
            Complete KYB or KYC
          </DecoratedButton>
          <DecoratedButton
            type="button"
            variant="secondary"
            className="h-12 w-[360px] rounded-[10px]"
            onClick={() => setShowVerifyLaterDialog(true)}
            disabled={isLoading}
          >
            Start now, verify later
          </DecoratedButton>
        </div>
      </div>
    </SizingWrapper>
  );
};
