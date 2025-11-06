"use client";
import { DecoratedButton } from "@/components/DecoratedButton";
import { IdentificationIcon } from "@/components/Icons/IdentificationIcon";
import { MailWithLines } from "@/components/Icons/MailWithLines";
import { RemoveCustomIcon } from "@/components/Icons/RemoveCustomIcon";
import { SpinnerIcon } from "@/components/Icons/SpinnerIcon";
import { IconFrame } from "@/components/InitialSteps/IconFrame";
import { SizingWrapper } from "@/components/SizingWrapper";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import {
  GetIdentityVerificationLinkResponse,
  IdentityVerificationStatus,
} from "@/lib/types";
import { useGetAffiliateMetadata } from "@/scenes/Portal/Teams/TeamId/Team/AffiliateProgram/Overview/page/hooks/use-get-affiliate-metadata";
import { getIdentityVerificationLink } from "@/scenes/Portal/Teams/TeamId/Team/AffiliateProgram/Overview/server/getIdentityVerificationLink";
import { useMemo, useState } from "react";
import Skeleton from "react-loading-skeleton";
import { toast } from "react-toastify";
import { AcceptTermsDialog } from "./AcceptTerms";
import { Button } from "@/components/Button";
import { ArrowDownSharpIcon } from "@/components/Icons/ArrowDownSharp";

export const VerifyPage = () => {
  const { data, loading: isMetadataLoading } = useGetAffiliateMetadata();
  const [isLoading, setIsLoading] = useState(false);
  const [showAcceptTerms, setShowAcceptTerms] = useState(false);

  const title = useMemo(() => {
    if (!data) return null;

    const status = data.identityVerificationStatus;
    const type = data.verificationType === "kyb" ? "KYB" : "KYC";

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
  }, [data]);

  const description = useMemo(() => {
    if (!data) return null;

    const status = data.identityVerificationStatus;

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
  }, [data]);

  const actionButton = useMemo(() => {
    if (!data) return "Complete";

    return data.identityVerificationStatus === IdentityVerificationStatus.FAILED
      ? "Try again"
      : "Complete";
  }, [data]);

  const handleCompleteKyb = async () => {
    if (!data) return;

    setShowAcceptTerms(false);
    setIsLoading(true);

    try {
      const result = await getIdentityVerificationLink({
        type: data.verificationType,
        redirectUri: window.location.origin,
      });
      console.log("getIdentityVerificationLink data: ", result.data);

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

  return (
    <SizingWrapper
      gridClassName="order-2 grow"
      className="flex flex-col place-content-center items-center"
      variant="nav"
    >
      <AcceptTermsDialog
        open={showAcceptTerms}
        onConfirm={handleCompleteKyb}
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
            <>
              {data?.identityVerificationStatus ===
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
                  {title}
                </Typography>
                <Typography
                  as="p"
                  variant={TYPOGRAPHY.R5}
                  className="text-grey-500"
                >
                  {description}
                </Typography>
              </div>
              {isLoading ||
              data?.identityVerificationStatus ===
                IdentityVerificationStatus.PENDING ? (
                <SpinnerIcon className="ml-auto size-6 animate-spin" />
              ) : (
                <>
                  <Button
                    type="button"
                    onClick={() => setShowAcceptTerms(true)}
                    className="ml-auto flex size-6 items-center justify-center rounded-full bg-grey-900 md:hidden"
                  >
                    <ArrowDownSharpIcon className="size-3 text-grey-0" />
                  </Button>
                  <DecoratedButton
                    type="button"
                    onClick={() => setShowAcceptTerms(true)}
                    className="ml-auto hidden md:block"
                  >
                    {actionButton}
                  </DecoratedButton>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </SizingWrapper>
  );
};
