"use client";
import { Section } from "@/components/Section";
import { SizingWrapper } from "@/components/SizingWrapper";
import { EarningsHeader } from "./EarningsHeader";
import clsx from "clsx";
import { useGetAffiliateBalance } from "../../common/hooks/use-get-affiliate-balance";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { TransactionsTable } from "./TransactionsTable";
import { RewardsChart } from "./RewardsChart";

export const EarningsPage = () => {
  const { data, loading: isMetadataLoading } = useGetAffiliateBalance();

  return (
    <>
      <SizingWrapper
        gridClassName="order-2 grow"
        className={clsx("flex flex-col")}
      >
        <Section>
          <EarningsHeader loading={isMetadataLoading} data={data} />

          <div className="mt-6 grid grid-cols-1 items-start gap-10 md:mt-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:gap-30">
            <div className="flex flex-col gap-8">
              <Typography variant={TYPOGRAPHY.H7}>Earnings</Typography>
              <RewardsChart />
            </div>
            <TransactionsTable />
          </div>
        </Section>
      </SizingWrapper>
    </>
  );
};
