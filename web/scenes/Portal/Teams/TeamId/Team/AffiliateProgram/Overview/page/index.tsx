"use client";
import { Section } from "@/components/Section";
import { SizingWrapper } from "@/components/SizingWrapper";
import { useGetAffiliateMetadata } from "./hooks/use-get-affiliate-metadata";
import { InviteUserDialog } from "./InviteUserDialog";
import { OverviewProfile } from "./OverviewProfile";
import { VerificationsChart } from "./VerificationsChart";

export const AffiliateProgramPage = () => {
  const { data: metadata, loading: isMetadataLoading } =
    useGetAffiliateMetadata();

  return (
    <>
      <SizingWrapper
        gridClassName="order-2 grow"
        className="flex flex-col"
        variant="nav"
      >
        <InviteUserDialog data={metadata} />

        <Section>
          <OverviewProfile loading={isMetadataLoading} data={metadata} />
          <VerificationsChart />
        </Section>
      </SizingWrapper>
    </>
  );
};
