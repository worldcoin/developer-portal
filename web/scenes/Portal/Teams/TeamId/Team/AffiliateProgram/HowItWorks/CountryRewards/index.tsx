"use client";
import { CaretIcon } from "@/components/Icons/CaretIcon";
import { SizingWrapper } from "@/components/SizingWrapper";
import { Tab, Tabs } from "@/components/Tabs";
import { Typography, TYPOGRAPHY } from "@/components/Typography";
import { useGetAffiliateMetadata } from "@/scenes/Portal/Teams/TeamId/Team/AffiliateProgram/Overview/page/hooks/use-get-affiliate-metadata";
import clsx from "clsx";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { CountryList } from "./CountryList";

type PageProps = {
  params: {
    teamId: string;
  };
};

export const RewardsPage = (props: PageProps) => {
  const { params } = props;
  const searchParams = useSearchParams();
  const type = searchParams.get("type") || "orb";

  const { data: metadata, loading: isMetadataLoading } =
    useGetAffiliateMetadata();

  const countryRewardsList = useMemo(() => {
    const rewardsObj =
      type === "orb" ? metadata?.rewards.orb : metadata?.rewards.nfc;
    return rewardsObj
      ? Object.entries(rewardsObj).map(([countryCode, value]) => ({
          countryCode,
          asset: value.asset,
          amount: value.amount,
        }))
      : [];
  }, [metadata?.rewards, type]);

  return (
    <>
      <SizingWrapper
        gridClassName="order-2 grow mt-6 md:mt-10"
        className="flex flex-col"
      >
        <Link
          href={`/teams/${params!.teamId}/affiliate-program/how-it-works`}
          className="flex flex-row items-center gap-x-2"
        >
          <CaretIcon className="size-3 rotate-90 text-grey-400" />
          <Typography variant={TYPOGRAPHY.R5} className="text-grey-700">
            Back to How it works
          </Typography>
        </Link>
        <div
          className={clsx(
            "mx-auto mt-8 grid w-full max-w-[380px] items-center justify-items-center gap-y-6 text-center ",
          )}
        >
          <Typography variant={TYPOGRAPHY.H5}>
            Rewards based
            <br />
            on country
          </Typography>

          <div className="w-full">
            <Tabs className="m-auto w-full justify-center border-grey-100 font-gta md:border-b">
              <Tab
                href={`/teams/${params!.teamId}/affiliate-program/how-it-works/rewards?type=orb`}
                underlined
                segment={null}
                active={type === "orb"}
              >
                <Typography variant={TYPOGRAPHY.R4}>Orb rewards</Typography>
              </Tab>

              <Tab
                href={`/teams/${params!.teamId}/affiliate-program/how-it-works/rewards?type=nfc`}
                underlined
                segment={null}
                active={type === "nfc"}
              >
                <Typography variant={TYPOGRAPHY.R4}>ID rewards</Typography>
              </Tab>
            </Tabs>
          </div>

          <CountryList
            loading={isMetadataLoading}
            countries={countryRewardsList}
          />
        </div>
      </SizingWrapper>
    </>
  );
};
