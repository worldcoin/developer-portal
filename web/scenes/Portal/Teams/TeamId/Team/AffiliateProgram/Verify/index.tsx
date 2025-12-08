"use client";
import { MailWithLines } from "@/components/Icons/MailWithLines";
import { SizingWrapper } from "@/components/SizingWrapper";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { GetIdentityVerificationLinkResponse } from "@/lib/types";
import { useGetAffiliateMetadata } from "@/scenes/Portal/Teams/TeamId/Team/AffiliateProgram/Overview/page/hooks/use-get-affiliate-metadata";
import { getIdentityVerificationLink } from "@/scenes/Portal/Teams/TeamId/Team/AffiliateProgram/Overview/server/getIdentityVerificationLink";
import { useState } from "react";
import Skeleton from "react-loading-skeleton";
import { toast } from "react-toastify";
import { AcceptTermsDialog } from "./AcceptTerms";
import { RequestStep } from "@/scenes/Portal/Teams/TeamId/Team/AffiliateProgram/Verify/RequestStep";
import { KybStep } from "@/scenes/Portal/Teams/TeamId/Team/AffiliateProgram/Verify/KybStep";

export const VerifyPage = () => {
  const { data: metadata, loading: isMetadataLoading } =
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

        {/*<Step*/}
        {/*    key={`apps-tutorial-step-2`}*/}
        {/*    href="?createAction=true"*/}
        {/*    icon={*/}
        {/*      metadata?.identityVerificationStatus ===*/}
        {/*      IdentityVerificationStatus.FAILED ? (*/}
        {/*          <IconFrame className="flex-shrink-0 bg-system-error-50 text-system-error-500">*/}
        {/*            <RemoveCustomIcon className="size-5"/>*/}
        {/*          </IconFrame>*/}
        {/*      ) : (*/}
        {/*          <IconFrame className="flex-shrink-0 bg-blue-500 text-grey-0">*/}
        {/*            <IdentificationIcon className="size-5"/>*/}
        {/*          </IconFrame>*/}
        {/*      )*/}
        {/*    }*/}
        {/*    title={requestConfig?.title || ""}*/}
        {/*    description={requestConfig?.description || ""}*/}
        {/*    buttonText={requestConfig?.buttonTxt || ""}*/}
        {/*    disabled={false}*/}
        {/*/>*/}

        <div className="mt-6 flex w-full items-center gap-3 rounded-2xl border border-grey-200 p-6 md:mt-10">
          {isMetadataLoading ? (
            <>
              <Skeleton circle className="size-10" />
              <div className="h-10 flex-1 text-start">
                <Skeleton height={20} width={100} />
                <Skeleton height={16} width={150} />
              </div>
              <Skeleton height={36} width={100} />
            </>
          ) : (
            metadata && (
              <RequestStep
                metadata={metadata}
                isMetadataLoading={isLoading}
                onComplete={handleComplete}
              />
            )
          )}
        </div>

        <div className="mt-6 flex w-full items-center gap-3 rounded-2xl border border-grey-200 p-6 md:mt-10">
          {isMetadataLoading ? (
            <>
              <Skeleton circle className="size-10" />
              <div className="h-10 flex-1 text-start">
                <Skeleton height={20} width={100} />
                <Skeleton height={16} width={150} />
              </div>
              <Skeleton height={36} width={100} />
            </>
          ) : (
            metadata && (
              <KybStep
                metadata={metadata}
                isLoading={isLoading}
                onComplete={handleComplete}
              />
            )
          )}
        </div>
      </div>
    </SizingWrapper>
  );
};
