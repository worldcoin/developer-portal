"use client";
import { CheckmarkBadge } from "@/components/Icons/CheckmarkBadge";
import { FlaskIcon } from "@/components/Icons/FlaskIcon";
import { MultiplePlusIcon } from "@/components/Icons/MultiplePlusIcon";
import { UserCardIcon } from "@/components/Icons/UserCardIcon";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { SIMULATOR_URL } from "@/lib/constants";
import { urls } from "@/lib/urls";
import { teamId } from "@/tests/e2e/helpers/constants";
import { useMemo } from "react";
import { VerificationStatus } from "..";
import { QuickAction } from "../../../../../../../../components/QuickAction";
import { useGetVerificationDataQuery } from "../graphql/client/get-verification-data.generated";

export const QuickActionsSection = ({ appId }: { appId: string }) => {
  const { data } = useGetVerificationDataQuery({
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

  return (
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
            href={urls.configuration({ team_id: teamId, app_id: appId })}
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
  );
};
