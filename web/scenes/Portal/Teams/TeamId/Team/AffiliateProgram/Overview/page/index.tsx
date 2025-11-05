"use client";
import { Section } from "@/components/Section";
import { SizingWrapper } from "@/components/SizingWrapper";
import clsx from "clsx";
import { useGetAffiliateMetadata } from "./hooks/use-get-affiliate-metadata";
import { InviteUserDialog } from "./InviteUserDialog";
import { NotVerified } from "./NotVerified";
import { OverviewProfile } from "./OverviewProfile";
import { VerificationsChart } from "./VerificationsChart";
import { IdentityVerificationStatus } from "@/lib/types";

export const AffiliateProgramPage = () => {
  const { data: metadata, loading: isMetadataLoading } =
    useGetAffiliateMetadata();
  const isUserPassedKyc =
    !isMetadataLoading &&
    metadata?.identityVerificationStatus === IdentityVerificationStatus.SUCCESS;

  return (
    <>
      <SizingWrapper
        gridClassName="order-2 grow"
        className={clsx("flex flex-col", {
          "place-content-center items-center":
            !isMetadataLoading &&
            metadata?.identityVerificationStatus !==
              IdentityVerificationStatus.SUCCESS,
        })}
        variant="nav"
      >
        <InviteUserDialog data={metadata} />

        {metadata && !isUserPassedKyc ? (
          <NotVerified data={metadata} />
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
