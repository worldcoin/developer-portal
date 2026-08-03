"use client";

import { DangerZoneCard } from "@/components/DangerZoneCard";
import { DestructiveTriggerButton } from "@/components/DestructiveTriggerButton";
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
  variant?: "default" | "compact";
};

/**
 * Destructive app action that can render either as the dedicated danger-page
 * card or the compact World ID Configuration card.
 */
export const DangerZoneSection = ({
  appId,
  teamId,
  appName,
  variant,
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
        variant={variant}
        footerText={
          isEnoughPermissions
            ? undefined
            : "Only a team owner can delete this app."
        }
        footerAction={
          isEnoughPermissions && (
            <DestructiveTriggerButton
              onClick={() => setOpenDeleteModal(true)}
              className="shrink-0"
            >
              Delete app
            </DestructiveTriggerButton>
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
