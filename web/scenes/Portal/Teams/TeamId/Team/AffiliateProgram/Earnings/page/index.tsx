"use client";
import { Section } from "@/components/Section";
import { SizingWrapper } from "@/components/SizingWrapper";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import {
  GetIdentityVerificationLinkResponse,
  IdentityVerificationStatus,
} from "@/lib/types";
import { useGetAffiliateMetadata } from "@/scenes/Portal/Teams/TeamId/Team/AffiliateProgram/Overview/page/hooks/use-get-affiliate-metadata";
import { getIdentityVerificationLink } from "@/scenes/Portal/Teams/TeamId/Team/AffiliateProgram/Overview/server/getIdentityVerificationLink";
import { SelectVerificationDialog } from "@/scenes/Portal/Teams/TeamId/Team/AffiliateProgram/Verify/SelectVerificationDialog";
import clsx from "clsx";
import { useState } from "react";
import { toast } from "react-toastify";
import { useGetAffiliateBalance } from "../../common/hooks/use-get-affiliate-balance";
import { EarningsHeader } from "./EarningsHeader";
import { RewardsChart } from "./RewardsChart";
import { TransactionsTable } from "./TransactionsTable";
import { VerificationBanner } from "./VerificationBanner";
import { useGetAffiliateTransactions } from "./hooks/use-get-affiliate-transactions";

export const EarningsPage = () => {
  const { data, loading: isBalanceLoading } = useGetAffiliateBalance();
  const { data: metadata, loading: isMetadataLoading } = useGetAffiliateMetadata();
  const transactionsData = useGetAffiliateTransactions();
  const [showVerificationSelection, setShowVerificationSelection] =
    useState(false);
  const [isVerificationLoading, setIsVerificationLoading] = useState(false);

  const isVerificationRequired =
    metadata?.identityVerificationStatus !== IdentityVerificationStatus.SUCCESS;

  const hasTransactions =
    transactionsData.loading || transactionsData.totalCount > 0;

  const handleGetVerificationLink = async (type: "kyc" | "kyb") => {
    setIsVerificationLoading(true);

    try {
      const result = await getIdentityVerificationLink({
        type,
        redirectUri: window.location.href.replace("/earnings", ""),
      });

      if (result.success && result.data) {
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
      setIsVerificationLoading(false);
      setShowVerificationSelection(false);
    }
  };

  if (isBalanceLoading || isMetadataLoading || transactionsData.loading) {
    return null;
  }

  return (
    <>
      <SizingWrapper
        gridClassName="order-2 grow"
        className={clsx("flex flex-col")}
        variant="nav"
      >
        <Section>
          {isVerificationRequired && metadata && (
            <VerificationBanner
              onComplete={() => setShowVerificationSelection(true)}
              metadata={metadata}
            />
          )}

          <EarningsHeader
            loading={isBalanceLoading}
            data={data}
            onWithdrawClick={
              isVerificationRequired
                ? () => setShowVerificationSelection(true)
                : undefined
            }
          />

          <SelectVerificationDialog
            open={showVerificationSelection}
            onClose={() => setShowVerificationSelection(false)}
            onSelect={handleGetVerificationLink}
            isLoading={isVerificationLoading}
            title="Complete KYB or KYC"
            metadata={metadata}
          />

          <div className="mt-6 grid grid-cols-1 items-stretch gap-10 md:mt-10 md:grid-cols-12 md:gap-0">
            <div
              className={clsx(
                "col-span-full flex min-w-0 flex-col gap-4 md:mb-10 md:gap-8",
                hasTransactions ? "md:col-span-6" : "md:col-span-12",
              )}
            >
              {hasTransactions && (
                <Typography variant={TYPOGRAPHY.H7}>Earnings</Typography>
              )}
              <div className="flex min-h-0 flex-1 flex-col">
                <RewardsChart />
              </div>
            </div>
            {hasTransactions && (
              <div className="col-span-full flex min-w-0 flex-col md:col-span-5 md:col-start-8">
                <TransactionsTable {...transactionsData} />
              </div>
            )}
          </div>
        </Section>
      </SizingWrapper>
    </>
  );
};
