"use client";

import { CheckmarkBadge } from "@/components/Icons/CheckmarkBadge";
import { MultiplePlusIcon } from "@/components/Icons/MultiplePlusIcon";
import { QuickAction } from "@/components/QuickAction";
import { RestrictedAction } from "@/components/RestrictedAction";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { isWorldId40Enabled, worldId40Atom } from "@/lib/feature-flags";
import { useTeamPermission } from "@/lib/team-permissions/use-team-permission";
import { urls } from "@/lib/urls";
import { useAtomValue } from "jotai";

interface QuickActionsSectionProps {
  appId: string;
  teamId: string;
}

export const QuickActionsSection = ({
  appId,
  teamId,
}: QuickActionsSectionProps) => {
  const worldId40Config = useAtomValue(worldId40Atom);
  const showWorldId40Actions = isWorldId40Enabled(worldId40Config, teamId);
  const createWorldIdActionPerm = useTeamPermission(
    teamId,
    "create_world_id_action",
  );
  const createActionHref = showWorldId40Actions
    ? urls.createWorldIdAction({ team_id: teamId, app_id: appId })
    : urls.createAction({ team_id: teamId, app_id: appId });

  return (
    <div className="grid gap-y-6">
      <Typography variant={TYPOGRAPHY.H7}>Quick actions</Typography>

      <div className="grid gap-6 lg:grid-cols-3">
        <RestrictedAction restriction={createWorldIdActionPerm}>
          {({ disabled }) => (
            <QuickAction
              href={createActionHref}
              disabled={disabled}
              icon={<MultiplePlusIcon className="size-5" />}
              title="Create an action"
              description="Verify users as unique humans"
            />
          )}
        </RestrictedAction>

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
