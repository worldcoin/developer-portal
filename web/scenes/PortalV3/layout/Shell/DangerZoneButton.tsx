"use client";

import { DecoratedButton } from "@/components/DecoratedButton";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { Role_Enum } from "@/graphql/graphql";
import { Auth0SessionUser } from "@/lib/types";
import { urls } from "@/lib/urls";
import { checkUserPermissions } from "@/lib/utils";
import { useUser } from "@auth0/nextjs-auth0/client";
import { useParams, useRouter } from "next/navigation";

/**
 * Owner-only "Danger zone" entry rendered in the <PortalShell> header (the
 * rectangle that also contains the <AppsDropdown> switcher). Replaces the old
 * "Danger zone" sub-tab in the configuration layout. Shown only on app-scoped
 * routes (where `appId` is in the URL). Uses the destructive variant
 * (red bg / white text) so it reads as a danger action at a glance.
 */
export const DangerZoneButton = () => {
  const router = useRouter();
  const { teamId, appId } = useParams() as { teamId?: string; appId?: string };
  const { user } = useUser() as Auth0SessionUser;

  if (!teamId || !appId) return null;
  if (!checkUserPermissions(user, teamId, [Role_Enum.Owner])) return null;

  return (
    <DecoratedButton
      type="button"
      variant="destructive"
      className="ml-auto h-9 px-4 py-2"
      onClick={() =>
        router.push(
          `${urls.configuration({ team_id: teamId, app_id: appId })}/danger`,
        )
      }
    >
      <Typography variant={TYPOGRAPHY.M3}>Danger zone</Typography>
    </DecoratedButton>
  );
};
