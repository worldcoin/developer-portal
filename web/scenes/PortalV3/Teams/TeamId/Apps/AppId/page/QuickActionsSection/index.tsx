import { CheckmarkBadge } from "@/components/Icons/CheckmarkBadge";
import { DocsIcon } from "@/components/Icons/DocsIcon";
import { KeyIcon } from "@/components/Icons/KeyIcon";
import { MultiplePlusIcon } from "@/components/Icons/MultiplePlusIcon";
import { QuickAction } from "@/components/QuickAction";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { urls } from "@/lib/urls";

interface QuickActionsSectionProps {
  appId: string;
  teamId: string;
  showMiniApp: boolean;
}

export const QuickActionsSection = ({
  appId,
  teamId,
  showMiniApp,
}: QuickActionsSectionProps) => {
  return (
    <div className="grid gap-y-6">
      <Typography variant={TYPOGRAPHY.H7}>Quick actions</Typography>

      <div className="grid gap-6 lg:grid-cols-3">
        <QuickAction
          href={`${urls.worldIdActions({ team_id: teamId, app_id: appId })}?createAction=true`}
          icon={<MultiplePlusIcon className="size-5" />}
          title="Create an action"
          description="Verify users as unique humans"
        />

        {showMiniApp ? (
          <QuickAction
            href={urls.configuration({ team_id: teamId, app_id: appId })}
            icon={<CheckmarkBadge className="size-5" />}
            title="Get your app verified"
            description="Verified apps get more users."
          />
        ) : (
          <>
            <QuickAction
              href={urls.signInWorldId({ team_id: teamId, app_id: appId })}
              icon={<KeyIcon className="size-5" />}
              title="Add Sign in with World ID"
              description="Let users sign in with World ID"
            />

            <QuickAction
              href="https://docs.world.org/world-id"
              target="_blank"
              rel="noreferrer"
              icon={<DocsIcon className="size-5" />}
              title="Read the docs"
              description="Learn how to integrate World ID"
            />
          </>
        )}
      </div>
    </div>
  );
};
