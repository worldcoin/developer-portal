"use client";
import { DecoratedButton } from "@/components/DecoratedButton";
import { SizingWrapper } from "@/components/SizingWrapper";
import { Stepper } from "@/components/Stepper";
import { Typography, TYPOGRAPHY } from "@/components/Typography";
import { useGetAffiliateMetadata } from "@/scenes/Portal/Teams/TeamId/Team/AffiliateProgram/Overview/page/hooks/use-get-affiliate-metadata";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import Skeleton from "react-loading-skeleton";

type PageProps = {
  params: {
    teamId: string;
  };
};

export const HowItWorksPage = (props: PageProps) => {
  const { params } = props;
  const teamId = params?.teamId;
  const router = useRouter();
  const { data: metadata, loading: isMetadataLoading } =
    useGetAffiliateMetadata();

  const steps = [
    {
      id: "invite",
      title: "Invite humans with your invite code",
    },
    {
      id: "apply",
      title: "They need to apply your invite code",
    },
    {
      id: "verify",
      title: "They complete Orb or ID verification",
    },
    {
      id: "claim",
      title: "They need to claim their first Worldcoin",
    },
    {
      id: "reward",
      title: "You will receive your reward",
      isFinal: true,
    },
  ];

  // Return max amount for orb type and nfc type
  const maxOrbReward = useMemo(() => {
    const rewards = Object.values(metadata?.rewards?.orb ?? {});
    if (!rewards.length) return null;
    const max = rewards.reduce((a, b) => (b.amount > a.amount ? b : a));
    return { asset: max.asset, amount: max.amount };
  }, [metadata?.rewards?.orb]);

  const maxNfcReward = useMemo(() => {
    const rewards = Object.values(metadata?.rewards?.nfc ?? {});
    if (!rewards.length) return null;
    const max = rewards.reduce((a, b) => (b.amount > a.amount ? b : a));
    return { asset: max.asset, amount: max.amount };
  }, [metadata?.rewards?.nfc]);

  return (
    <>
      <SizingWrapper
        gridClassName="order-2 grow mt-6 md:mt-10"
        className="flex flex-col"
      >
        <div className="grid grid-cols-1 gap-12 md:grid-cols-2 md:gap-0 md:divide-x md:divide-gray-200">
          {/* How it works section */}
          <div className="space-y-6 md:space-y-8 md:pr-30">
            <Typography variant={TYPOGRAPHY.H6}>How it works</Typography>

            <Stepper steps={steps} />
          </div>

          {/* Rewards section */}
          <div className="space-y-6 md:space-y-8 md:pl-30">
            <div className="flex flex-col gap-3">
              <Typography variant={TYPOGRAPHY.H6}>Rewards</Typography>

              <Typography
                as="p"
                variant={TYPOGRAPHY.R4}
                className="text-gray-500"
              >
                Amount that you can receive is based on a user's <br /> country
                and type of verification they complete
              </Typography>
            </div>

            <div className="grid space-y-5 border-y border-gray-100 pt-6 md:py-8">
              <div className="flex items-center justify-between">
                <Typography variant={TYPOGRAPHY.R4} className="text-gray-500">
                  Orb verified human
                </Typography>
                {isMetadataLoading ? (
                  <Skeleton width={120} />
                ) : (
                  <Typography variant={TYPOGRAPHY.M4} className="font-medium">
                    up to {maxOrbReward?.amount} {maxOrbReward?.asset} in WLD
                  </Typography>
                )}
              </div>

              <div className="flex items-center justify-between">
                <Typography variant={TYPOGRAPHY.R4} className="text-gray-500">
                  ID verified human
                </Typography>
                {isMetadataLoading ? (
                  <Skeleton width={120} />
                ) : (
                  <Typography variant={TYPOGRAPHY.M4} className="font-medium">
                    up to {maxNfcReward?.amount} {maxNfcReward?.asset} in WLD
                  </Typography>
                )}
              </div>
            </div>

            <DecoratedButton
              type="button"
              variant="secondary"
              className="mt-6 w-full md:w-fit"
              onClick={() => {
                router.push(
                  `/teams/${teamId}/affiliate-program/how-it-works/rewards`,
                );
              }}
            >
              Rewards overview
            </DecoratedButton>
          </div>
        </div>
      </SizingWrapper>
    </>
  );
};
