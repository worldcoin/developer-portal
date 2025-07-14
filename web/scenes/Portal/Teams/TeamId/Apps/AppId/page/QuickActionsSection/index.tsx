"use client";
import { FlaskIcon } from "@/components/Icons/FlaskIcon";
import { MultiplePlusIcon } from "@/components/Icons/MultiplePlusIcon";
import { QuickAction } from "@/components/QuickAction";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { SIMULATOR_URL } from "@/lib/constants";
import { urls } from "@/lib/urls";

export const QuickActionsSection = ({
  appId,
  teamId,
}: {
  appId: string;
  teamId: string;
}) => {
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
      </div>
    </div>
  );
};
