"use client";

import { DecoratedButton } from "@/components/DecoratedButton";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { Role_Enum } from "@/graphql/graphql";
import { Auth0SessionUser } from "@/lib/types";
import { checkUserPermissions, truncateString } from "@/lib/utils";
import { useUser } from "@auth0/nextjs-auth0/client";
import { useMemo, useState } from "react";
import { DeleteModal } from "./DeleteModal";

type DangerZoneSectionProps = {
  appId: `app_${string}`;
  teamId: string;
  appName?: string;
};

/**
 * Destructive app action. Kept on its own route so it cannot be mistaken for
 * another step in the configuration form.
 */
export const DangerZoneSection = ({
  appId,
  teamId,
  appName,
}: DangerZoneSectionProps) => {
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const { user } = useUser() as Auth0SessionUser;

  const isEnoughPermissions = useMemo(
    () => checkUserPermissions(user, teamId ?? "", [Role_Enum.Owner]),
    [user, teamId],
  );

  return (
    <div className="overflow-hidden rounded-2xl border border-system-error-200 bg-grey-0">
      <div className="grid gap-y-2 p-6">
        <Typography variant={TYPOGRAPHY.M3} className="text-grey-900">
          Delete this app
        </Typography>

        <Typography variant={TYPOGRAPHY.R3} className="max-w-2xl text-grey-500">
          Permanently delete{" "}
          <Typography variant={TYPOGRAPHY.M3} className="text-grey-900">
            {truncateString(appName, 30)}
          </Typography>{" "}
          and all of its data for everyone. This action cannot be undone.
        </Typography>
      </div>

      <div className="flex items-center justify-between gap-4 border-t border-system-error-100 bg-system-error-50 px-6 py-4">
        <Typography variant={TYPOGRAPHY.R4} className="text-system-error-700">
          {isEnoughPermissions
            ? "You’ll be asked to confirm before anything is deleted."
            : "Only a team owner can delete this app."}
        </Typography>

        {isEnoughPermissions && (
          <DecoratedButton
            type="button"
            variant="destructive"
            onClick={() => setOpenDeleteModal(true)}
            className="shrink-0"
          >
            <Typography variant={TYPOGRAPHY.R3}>Delete app</Typography>
          </DecoratedButton>
        )}
      </div>

      <DeleteModal
        appName={appName ?? ""}
        appId={appId}
        teamId={teamId}
        openDeleteModal={openDeleteModal}
        setOpenDeleteModal={setOpenDeleteModal}
      />
    </div>
  );
};
