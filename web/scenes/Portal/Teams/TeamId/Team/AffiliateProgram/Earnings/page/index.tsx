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
          {metadata && (
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

          {hasTransactions ? (
            <div className="mt-6 grid w-full min-w-0 grid-cols-1 items-start gap-10 md:mt-10 md:grid-cols-[minmax(0,6fr)_minmax(0,5fr)] md:gap-x-10 md:gap-y-0">
              <div className="flex min-w-0 flex-col gap-4 md:mb-10 md:gap-8">
                <Typography variant={TYPOGRAPHY.H7}>Earnings</Typography>
                <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
                  <RewardsChart />
                </div>
              </div>
              <div className="min-w-0 overflow-x-auto md:max-w-none">
                <TransactionsTable {...transactionsData} />
              </div>
            </div>
          ) : (
            <div className="mt-6 w-full min-w-0 md:mt-10">
              <div className="flex w-full min-w-0 flex-col gap-4 md:mb-10 md:gap-8">
                <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col">
                  <RewardsChart />
                </div>
              </div>
            </div>
          )}
        </Section>
      </SizingWrapper>
    </>
  );
};
