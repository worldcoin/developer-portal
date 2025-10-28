"use client";
import { Section } from "@/components/Section";
import { SizingWrapper } from "@/components/SizingWrapper";
import clsx from "clsx";
import { useGetAffiliateMetadata } from "./hooks/use-get-affiliate-metadata";
import { InviteUserDialog } from "./InviteUserDialog";
import { OverviewProfile } from "./OverviewProfile";
import { VerificationsChart } from "./VerificationsChart";
import { NotVerified } from "./NotVerified";

export const AffiliateProgramPage = () => {
  const { data: metadata, loading: isMetadataLoading } =
    useGetAffiliateMetadata();
  const isUserPassedKyc =
    !isMetadataLoading && metadata?.identityVerificationStatus === "approved";

  return (
    <>
      <SizingWrapper
        gridClassName="order-2 grow"
        className={clsx("flex flex-col", {
          "place-content-center":
            !isMetadataLoading &&
            metadata?.identityVerificationStatus !== "approved",
        })}
      >
        <InviteUserDialog data={metadata} />

        {metadata && !isUserPassedKyc ? (
          <NotVerified />
        ) : (
          <Section>
            <OverviewProfile loading={isMetadataLoading} data={metadata} />
            <VerificationsChart />
          </Section>
        )}
      </SizingWrapper>
    </>
  );
};
