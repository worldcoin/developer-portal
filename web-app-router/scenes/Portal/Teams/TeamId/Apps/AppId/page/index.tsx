import { SizingWrapper } from "@/components/SizingWrapper";
import { AppStatsGraph } from "./AppStatsGraph";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import dayjs from "dayjs";
import advancedFormat from "dayjs/plugin/advancedFormat";
import { QuickAction } from "./QuickAction";
import { MultiplePlusIcon } from "@/components/Icons/MultiplePlusIcon";
import { FlaskIcon } from "@/components/Icons/FlaskIcon";
import { SIMULATOR_URL } from "@/lib/constants";
import { urls } from "@/lib/urls";
import { ReviewStatus } from "@/scenes/Portal/Teams/TeamId/Apps/common/ReviewStatus";
import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import { getSdk as getVerificationStatusSdk } from "./graphql/server/get-verification-status.generated";
import {
  FetchAppVerificationDataQuery,
  getSdk as getVerificationDataSdk,
} from "./graphql/server/get-verification-data.generated";
import { CheckmarkBadge } from "@/components/Icons/CheckmarkBadge";
import { UserCardIcon } from "@/components/Icons/UserCardIcon";
import { ReviewMessageDialog } from "@/scenes/Portal/Teams/TeamId/Apps/common/ReviewMessage";

dayjs.extend(advancedFormat);

enum VerificationStatus {
  Unverified = "unverified",
  AwaitingReview = "awaiting_review",
  ChangesRequested = "changes_requested",
  Verified = "verified",
}

export const AppIdPage = async (props: {
  params: {
    teamId: string;
    appId: string;
  };
}) => {
  const { teamId, appId } = props.params;
  const client = await getAPIServiceGraphqlClient();

  let verificationStatus: VerificationStatus | null = null;

  try {
    const data = await getVerificationStatusSdk(client).GetVerificationStatus({
      id: appId,
    });

    verificationStatus = data.app_by_pk?.app_metadata[0]
      ?.verification_status as VerificationStatus;
  } catch (error) {
    console.error("Error fetching verification status", error);
  }

  const shouldFetchVerificationData =
    verificationStatus !== VerificationStatus.Unverified &&
    verificationStatus !== null &&
    verificationStatus !== VerificationStatus.AwaitingReview;

  let verificationData:
    | NonNullable<
        FetchAppVerificationDataQuery["app_by_pk"]
      >["app_metadata"][number]
    | undefined
    | null = null;

  if (shouldFetchVerificationData) {
    try {
      const data = await getVerificationDataSdk(
        client,
      ).FetchAppVerificationData({
        id: appId,
      });

      verificationData = data.app_by_pk?.app_metadata[0];
    } catch (error) {
      console.error("Error fetching verification data", error);
    }
  }

  const shouldDisplayReviewStatus = verificationData !== null;

  return (
    <SizingWrapper className="grid gap-y-10 py-5">
      <div className="grid gap-y-5">
        {shouldDisplayReviewStatus && (
          <ReviewStatus
            status={
              (verificationData?.verification_status as VerificationStatus.ChangesRequested) ||
              VerificationStatus.Verified
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

        <div className="grid grid-cols-3 gap-x-6">
          <QuickAction
            icon={<MultiplePlusIcon />}
            title="Create an action"
            description="Verify users as unique humans"
            href={urls.createAction({ team_id: teamId, app_id: appId })}
          />

          <QuickAction
            icon={<FlaskIcon />}
            title="Try simulator"
            description="Test your app in simulator"
            href={SIMULATOR_URL}
          />

          {verificationStatus !== VerificationStatus.Verified && (
            <QuickAction
              icon={<CheckmarkBadge className="w-[22px] h-[22px]" />}
              title="Get your app verified"
              description="Get a green badge for your app"
              // FIXME: pass relevant href/onClick
              href="#"
            />
          )}

          {verificationStatus === VerificationStatus.Verified && (
            <QuickAction
              icon={<UserCardIcon />}
              title="Sign in with World ID"
              description="Let users sign in with their World ID"
              // FIXME: pass relevant href/onClick
              href="#"
            />
          )}
        </div>
      </div>

      {verificationData?.id && (
        <ReviewMessageDialog
          message={verificationData?.review_message ?? ""}
          metadataId={verificationData?.id}
        />
      )}
    </SizingWrapper>
  );
};
