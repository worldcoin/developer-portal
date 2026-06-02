"use client";
import { DecoratedButton } from "@/components/DecoratedButton";
import { MailWithLines } from "@/components/Icons/MailWithLines";
import { SizingWrapper } from "@/components/SizingWrapper";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { GetIdentityVerificationLinkResponse } from "@/lib/types";
import { urls } from "@/lib/urls";
import { Auth0SessionUser } from "@/lib/types";
import { isAffiliateKycEnabled } from "@/scenes/Portal/Teams/TeamId/Team/AffiliateProgram/common/is-affiliate-kyc-enabled";
import { useGetAffiliateMetadata } from "@/scenes/Portal/Teams/TeamId/Team/AffiliateProgram/Overview/page/hooks/use-get-affiliate-metadata";
import { getIdentityVerificationLink } from "@/scenes/Portal/Teams/TeamId/Team/AffiliateProgram/Overview/server/getIdentityVerificationLink";
import { useUser } from "@auth0/nextjs-auth0/client";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { toast } from "react-toastify";
import { AcceptTermsDialog } from "./AcceptTerms";
import { SelectVerificationDialog } from "./SelectVerificationDialog";
import { VerifyLaterDialog } from "./VerifyLaterDialog";

export const VerifyPage = () => {
  const { user: auth0User } = useUser() as Auth0SessionUser;
  const showKycOption = isAffiliateKycEnabled(auth0User?.email);

  const { data: metadata, refetch: refetchAffiliateMetadata } =
    useGetAffiliateMetadata();
  const params = useParams();
  const teamId = params.teamId as string;
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingVerification, setLoadingVerification] = useState<
    "kyc" | "kyb" | null
  >(null);
  const [showAcceptTerms, setShowAcceptTerms] = useState(false);
  const [showVerificationSelection, setShowVerificationSelection] =
    useState(false);
  const [showVerifyLaterDialog, setShowVerifyLaterDialog] = useState(false);
  const [shouldGoToOverviewAfterTerms, setShouldGoToOverviewAfterTerms] =
    useState(false);

  /** Terms already accepted: leave verify on primary actions (not on KYC pick — terms are set then too). */
  const redirectToAffiliateIfTermsAccepted = useCallback((): boolean => {
    if (!metadata?.termsAcceptedAt) {
      return false;
    }
    router.push(urls.affiliateProgram({ team_id: teamId }));
    return true;
  }, [metadata?.termsAcceptedAt, router, teamId]);

  const handleGetVerificationLink = async (type: "kyc" | "kyb") => {
    if (!metadata) return;

    setShowVerificationSelection(false);
    setLoadingVerification(type);
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
      setLoadingVerification(null);
      setIsLoading(false);
    }
  };

  const handleComplete = () => {
    if (redirectToAffiliateIfTermsAccepted()) {
      return;
    }
    setShouldGoToOverviewAfterTerms(false);
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
        onConfirm={async () => {
          await refetchAffiliateMetadata();
          if (shouldGoToOverviewAfterTerms) {
            setShouldGoToOverviewAfterTerms(false);
            router.push(urls.affiliateProgram({ team_id: teamId }));
            return;
          }
          setShowVerificationSelection(true);
          setShowAcceptTerms(false);
        }}
        onClose={() => {
          setShouldGoToOverviewAfterTerms(false);
          setShowAcceptTerms(false);
        }}
      />
      <SelectVerificationDialog
        open={showVerificationSelection}
        onClose={() => {
          setShowVerificationSelection(false);
        }}
        onSelect={handleGetVerificationLink}
        loadingType={loadingVerification}
        title="Select verification"
        metadata={metadata}
        showKycOption={showKycOption}
      />
      <VerifyLaterDialog
        open={showVerifyLaterDialog}
        onClose={() => setShowVerifyLaterDialog(false)}
        showKycOption={showKycOption}
        onConfirm={() => {
          setShowVerifyLaterDialog(false);
          setShouldGoToOverviewAfterTerms(true);
          setShowAcceptTerms(true);
        }}
        onVerifyNow={() => {
          setShowVerifyLaterDialog(false);
          setShouldGoToOverviewAfterTerms(false);
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
            {`Complete ${showKycOption ? "KYB or KYC" : "KYB"}`}
          </DecoratedButton>
          <DecoratedButton
            type="button"
            variant="secondary"
            className="h-12 w-[360px] rounded-[10px]"
            onClick={() => {
              if (redirectToAffiliateIfTermsAccepted()) {
                return;
              }
              setShowVerifyLaterDialog(true);
            }}
            disabled={isLoading}
          >
            Start now, verify later
          </DecoratedButton>
        </div>
      </div>
    </SizingWrapper>
  );
};
