import { CheckmarkBadge } from "@/components/Icons/CheckmarkBadge";
import { MultiplePlusIcon } from "@/components/Icons/MultiplePlusIcon";
import { QuickAction } from "@/components/QuickAction";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { urls } from "@/lib/urls";

interface QuickActionsSectionProps {
  appId: string;
  teamId: string;
}

export const QuickActionsSection = ({
  appId,
  teamId,
}: QuickActionsSectionProps) => {
  return (
    <div className="grid gap-y-6">
      <Typography variant={TYPOGRAPHY.H7}>Quick actions</Typography>

      <div className="grid gap-6 lg:grid-cols-3">
        <QuickAction
          href={urls.createAction({ team_id: teamId, app_id: appId })}
          icon={<MultiplePlusIcon className="size-5" />}
          title="Create an action"
          description="Verify users as unique humans"
        />

        <QuickAction
          href={urls.configuration({ team_id: teamId, app_id: appId })}
          icon={<CheckmarkBadge className="size-5" />}
          title="Get your app verified"
          description="Verified apps get more users."
        />
      </div>
    </div>
  );
};
