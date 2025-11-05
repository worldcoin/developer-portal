"use client";
import { Section } from "@/components/Section";
import { SizingWrapper } from "@/components/SizingWrapper";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import clsx from "clsx";
import { useGetAffiliateBalance } from "../../common/hooks/use-get-affiliate-balance";
import { EarningsHeader } from "./EarningsHeader";
import { RewardsChart } from "./RewardsChart";
import { TransactionsTable } from "./TransactionsTable";

export const EarningsPage = () => {
  const { data, loading: isMetadataLoading } = useGetAffiliateBalance();

  return (
    <>
      <SizingWrapper
        gridClassName="order-2 grow"
        className={clsx("flex flex-col")}
        variant="nav"
      >
        <Section>
          <EarningsHeader loading={isMetadataLoading} data={data} />

          <div className="mt-6 grid auto-rows-min grid-cols-1 items-start gap-10 lg:mt-10 lg:grid-cols-12 lg:gap-0">
            <div className="col-span-full row-span-1 flex min-w-0 flex-col gap-8 lg:col-span-6">
              <Typography variant={TYPOGRAPHY.H7}>Earnings</Typography>
              <RewardsChart />
            </div>
            <div className="col-span-full row-span-1 min-w-0 lg:col-span-5 lg:col-start-8">
              <TransactionsTable />
            </div>
          </div>
        </Section>
      </SizingWrapper>
    </>
  );
};
