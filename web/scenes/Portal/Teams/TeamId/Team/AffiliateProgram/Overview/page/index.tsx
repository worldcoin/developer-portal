"use client";
import { DecoratedButton } from "@/components/DecoratedButton";
import { IdentificationIcon } from "@/components/Icons/IdentificationIcon";
import { MailWithLines } from "@/components/Icons/MailWithLines";
import { Section } from "@/components/Section";
import { SizingWrapper } from "@/components/SizingWrapper";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { IconFrame } from "@/components/InitialSteps/IconFrame";
import { TeamAffiliateProfile } from "@/scenes/Portal/Teams/TeamId/Team/AffiliateProgram/Overview/page/TeamAffiliateProfile";
import { InviteUserDialog } from "@/scenes/Portal/Teams/TeamId/Team/AffiliateProgram/Overview/page/InviteUserDialog";
import clsx from "clsx";
import { AppStatsGraph } from "@/scenes/Portal/Teams/TeamId/Team/AffiliateProgram/Overview/page/AppStatsGraph";
import { useGetAffiliateOverview } from "@/scenes/Portal/Teams/TeamId/Team/AffiliateProgram/Overview/page/hooks/use-get-affiliate-overview";
import { useGetAffiliateMetadata } from "@/scenes/Portal/Teams/TeamId/Team/AffiliateProgram/Overview/page/hooks/use-get-affiliate-metadata";
import Skeleton from "react-loading-skeleton";

type TeamApiKeysPageProps = {
  params: {
    teamId: string;
  };
};

export const AffiliateProgramPage = (props: TeamApiKeysPageProps) => {
  const {
    data: affiliateOverview,
    loading: isAffiliateOverviewLoading,
    error,
  } = useGetAffiliateOverview();
  const { data: metadata, loading: isMetadataLoading } =
    useGetAffiliateMetadata();
  const isUserPassedKyc =
    !isMetadataLoading && metadata?.identityVerificationStatus === "approved";

  return (
    <>
      <SizingWrapper
        gridClassName="order-2 grow"
        className={clsx("flex flex-col", {
          "place-content-center": !isUserPassedKyc,
        })}
      >
        <InviteUserDialog data={metadata} />

        {metadata && !isUserPassedKyc ? (
          <div className="grid grid-cols-1 justify-items-center pt-12">
            <MailWithLines className="md:max-w-[380px]" />

            <div className="mt-4 grid justify-items-center gap-y-2 ">
              <Typography variant={TYPOGRAPHY.H6}>
                Invite humans and earn rewards
              </Typography>

              <Typography
                variant={TYPOGRAPHY.R4}
                className="text-center text-grey-500"
              >
                Receive rewards for each human that uses your code and gets
                verified
              </Typography>
            </div>

            <div className="mt-10 flex items-center gap-3 rounded-2xl border border-grey-200 p-6">
              <IconFrame className="bg-blue-500 text-grey-0">
                <IdentificationIcon />
              </IconFrame>

              <div className="text-start">
                <Typography as="p" variant={TYPOGRAPHY.M3}>
                  Complete KYB
                </Typography>
                <Typography
                  as="p"
                  variant={TYPOGRAPHY.R5}
                  className="text-grey-500"
                >
                  To unlock affiliate program
                </Typography>
              </div>
              <DecoratedButton
                type="button"
                onClick={() => {
                  // TODO: call api to start verification
                }}
                className="h-9"
              >
                Complete
              </DecoratedButton>
            </div>
          </div>
        ) : (
          <Section>
            <SizingWrapper gridClassName="order-1">
              <TeamAffiliateProfile data={metadata} />
            </SizingWrapper>

            {isAffiliateOverviewLoading ? (
              <Skeleton count={5} />
            ) : (
              <AppStatsGraph appId="app_80f9f559216f596e5355066edfd7f58b" />
            )}
          </Section>
        )}
      </SizingWrapper>
    </>
  );
};
