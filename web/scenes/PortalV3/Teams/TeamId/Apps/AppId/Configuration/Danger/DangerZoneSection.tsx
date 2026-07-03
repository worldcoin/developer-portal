"use client";

import { DecoratedButton } from "@/components/DecoratedButton";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { Role_Enum } from "@/graphql/graphql";
import { Auth0SessionUser } from "@/lib/types";
import { checkUserPermissions, truncateString } from "@/lib/utils";
import { useUser } from "@auth0/nextjs-auth0/client";
import clsx from "clsx";
import { useMemo, useState } from "react";
import { DeleteModal } from "./DeleteModal";

type DangerZoneSectionProps = {
  appId: `app_${string}`;
  teamId: string;
  appName?: string;
};

/**
 * Danger zone (delete app) content, rendered as a section on the Configuration
 * (Overview) page and on the standalone /configuration/danger route. The delete
 * button is only actionable for team Owners.
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
    <div className="grid grid-cols-1 gap-y-10 md:w-1/2">
      <div className="grid gap-y-2">
        <Typography variant={TYPOGRAPHY.H7} className="text-grey-900">
          Danger zone
        </Typography>

        <Typography variant={TYPOGRAPHY.R3} className="text-grey-500">
          This will immediately and permanently delete the app{" "}
          <Typography variant={TYPOGRAPHY.M3} className="text-grey-900">
            {truncateString(appName, 30)}
          </Typography>{" "}
          and its data for everyone. This cannot be undone.
        </Typography>
      </div>

      <DecoratedButton
        type="button"
        variant="destructive"
        onClick={() => setOpenDeleteModal(true)}
        className={clsx("w-fit", { hidden: !isEnoughPermissions })}
      >
        <Typography variant={TYPOGRAPHY.R3}>Delete app</Typography>
      </DecoratedButton>

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
