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

          <div className="mt-6 grid grid-cols-1 items-stretch gap-10 md:mt-10 md:grid-cols-12 md:gap-0">
            <div className="col-span-full flex min-w-0 flex-col gap-8 md:col-span-6 md:mb-10">
              <Typography variant={TYPOGRAPHY.H7}>Earnings</Typography>
              <div className="flex min-h-0 flex-1 flex-col">
                <RewardsChart />
              </div>
            </div>
            <div className="col-span-full flex min-w-0 flex-col md:col-span-5 md:col-start-8">
              <TransactionsTable />
            </div>
          </div>
        </Section>
      </SizingWrapper>
    </>
  );
};
