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
  appId: string;
  teamId: string;
  appName?: string;
};

/** Card chrome with value slots, shared with the loading skeleton. */
export const DangerZoneCard = ({
  name,
  footerText,
  footerAction,
}: {
  name: React.ReactNode;
  footerText?: React.ReactNode;
  footerAction?: React.ReactNode;
}) => (
  <div className="overflow-hidden rounded-2xl border border-system-error-200 bg-grey-0">
    <div className="grid gap-y-2 p-6">
      <Typography variant={TYPOGRAPHY.M3} className="text-grey-900">
        Delete this app
      </Typography>

      <Typography variant={TYPOGRAPHY.R3} className="max-w-2xl text-grey-500">
        Permanently delete{" "}
        <Typography variant={TYPOGRAPHY.M3} className="text-grey-900">
          {name}
        </Typography>{" "}
        and all of its data for everyone. This action cannot be undone.
      </Typography>
    </div>

    <div className="flex items-center gap-4 px-6 pb-6">
      {footerAction}

      {footerText && (
        <Typography variant={TYPOGRAPHY.R4} className="text-system-error-700">
          {footerText}
        </Typography>
      )}
    </div>
  </div>
);

/**
 * Destructive app action, revealed from the collapsed Danger zone disclosure
 * in the wizard's Advanced settings.
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
    <>
      <DangerZoneCard
        name={truncateString(appName, 30)}
        footerText={
          isEnoughPermissions
            ? undefined
            : "Only a team owner can delete this app."
        }
        footerAction={
          isEnoughPermissions && (
            <DecoratedButton
              type="button"
              variant="destructive"
              onClick={() => setOpenDeleteModal(true)}
              className="shrink-0"
            >
              <Typography variant={TYPOGRAPHY.R3}>Delete app</Typography>
            </DecoratedButton>
          )
        }
      />

      <DeleteModal
        appName={appName ?? ""}
        appId={appId}
        teamId={teamId}
        openDeleteModal={openDeleteModal}
        setOpenDeleteModal={setOpenDeleteModal}
      />
    </>
  );
};
