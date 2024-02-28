"use client";

import { CheckmarkBadge } from "@/components/Icons/CheckmarkBadge";
import { FlaskIcon } from "@/components/Icons/FlaskIcon";
import { MultiplePlusIcon } from "@/components/Icons/MultiplePlusIcon";
import { UserCardIcon } from "@/components/Icons/UserCardIcon";
import { SizingWrapper } from "@/components/SizingWrapper";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { SIMULATOR_URL } from "@/lib/constants";
import { urls } from "@/lib/urls";
import { ReviewMessageDialog } from "@/scenes/Portal/Teams/TeamId/Apps/common/ReviewMessageDialog";
import { ReviewStatus } from "@/scenes/Portal/Teams/TeamId/Apps/common/ReviewStatus";
import dayjs from "dayjs";
import advancedFormat from "dayjs/plugin/advancedFormat";
import ErrorComponent from "next/error";
import { useMemo } from "react";
import { AppStatsGraph } from "./AppStatsGraph";
import { QuickAction } from "./QuickAction";
import { useGetVerificationDataQuery } from "./graphql/client/get-verification-data.generated";

dayjs.extend(advancedFormat);

enum VerificationStatus {
  Unverified = "unverified",
  AwaitingReview = "awaiting_review",
  ChangesRequested = "changes_requested",
  Verified = "verified",
}

export const AppIdPage = (props: {
  params: {
    teamId: string;
    appId: string;
  };
}) => {
  const { teamId, appId } = props.params;

  const { data, loading } = useGetVerificationDataQuery({
    variables: {
      id: appId,
    },
  });

  const verificationStatus = useMemo(
    () =>
      data?.verificationStatus?.app_metadata?.[0]
        .verification_status as VerificationStatus,
    [data],
  );

  const verificationData = useMemo(
    () => data?.verificationData?.app_metadata?.[0],
    [data],
  );

  if (!loading && !data?.hasApp?.id) {
    return (
      <ErrorComponent statusCode={404} title="App Not found"></ErrorComponent>
    );
  } else {
    return (
      <SizingWrapper className="flex flex-col gap-y-10 py-10">
        <div className="grid gap-y-3">
          {verificationData && (
            <ReviewStatus
              status={
                verificationData?.verification_status as
                  | VerificationStatus.ChangesRequested
                  | VerificationStatus.Verified
              }
              message={verificationData?.review_message ?? ""}
            />
          )}

          <div className="grid gap-y-3">
            <Typography as="h1" variant={TYPOGRAPHY.H6}>
              Your overview
            </Typography>

            <Typography variant={TYPOGRAPHY.R3} className="text-grey-500">
              It&apos;s {dayjs().format("dddd, Do [of] MMM")}
            </Typography>
          </div>
        </div>

        <AppStatsGraph />

        <div className="grid gap-y-6">
          <Typography variant={TYPOGRAPHY.H7}>Quick actions</Typography>

          <div className="grid gap-x-6 gap-y-4 lg:grid-cols-3">
            <QuickAction
              icon={<MultiplePlusIcon />}
              title="Create an action"
              description="Verify users as unique humans"
              href={urls.createAction({ team_id: teamId, app_id: appId })}
            />

            <QuickAction
              icon={<FlaskIcon />}
              title="Try simulator"
              description="Test your app in the simulator"
              href={SIMULATOR_URL}
            />

            {verificationStatus !== VerificationStatus.Verified && (
              <QuickAction
                icon={<CheckmarkBadge className="size-[22px]" />}
                title="Get your app verified"
                description="Display a verified app badge"
                href={urls.appProfile({ team_id: teamId, app_id: appId })}
              />
            )}

            {verificationStatus === VerificationStatus.Verified && (
              <QuickAction
                icon={<UserCardIcon />}
                title="Sign in with World ID"
                description="Let users sign in with their World ID"
                href={urls.signInWorldId({ team_id: teamId, app_id: appId })}
              />
            )}
          </div>
        </div>

        {verificationData?.id && (
          <ReviewMessageDialog
            message={verificationData?.review_message ?? ""}
            metadataId={verificationData?.id}
            goTo={urls.appProfile({ team_id: teamId, app_id: appId })}
          />
        )}
      </SizingWrapper>
    );
  }
};
