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
  variant?: "default" | "compact";
};

/** Card chrome with value slots, shared with the loading skeleton. */
export const DangerZoneCard = ({
  name,
  footerText,
  footerAction,
  variant = "default",
}: {
  name: React.ReactNode;
  footerText?: React.ReactNode;
  footerAction?: React.ReactNode;
  variant?: "default" | "compact";
}) => (
  <div className="overflow-hidden rounded-2xl border border-system-error-200 bg-grey-0">
    <div
      className={
        variant === "compact" ? "grid gap-y-2 p-5" : "grid gap-y-2 p-6"
      }
    >
      <Typography
        as="h3"
        variant={variant === "compact" ? TYPOGRAPHY.S2 : TYPOGRAPHY.M3}
        className="text-grey-900"
      >
        Delete this app
      </Typography>

      <Typography
        variant={variant === "compact" ? TYPOGRAPHY.B3 : TYPOGRAPHY.R3}
        className="max-w-2xl text-grey-500"
      >
        Permanently delete{" "}
        <Typography
          variant={variant === "compact" ? TYPOGRAPHY.S2 : TYPOGRAPHY.M3}
          className="text-grey-900"
        >
          {name}
        </Typography>{" "}
        and all of its data for everyone. This action cannot be undone.
      </Typography>
    </div>

    <div
      className={
        variant === "compact"
          ? "flex items-center gap-4 px-5 pb-5"
          : "flex items-center gap-4 px-6 pb-6"
      }
    >
      {footerAction}

      {footerText && (
        <Typography
          variant={variant === "compact" ? TYPOGRAPHY.B4 : TYPOGRAPHY.R4}
          className="text-system-error-700"
        >
          {footerText}
        </Typography>
      )}
    </div>
  </div>
);

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
            <DecoratedButton
              type="button"
              variant="destructive"
              onClick={() => setOpenDeleteModal(true)}
              className={
                variant === "compact"
                  ? "h-9 shrink-0 rounded-full px-4 py-0"
                  : "shrink-0"
              }
            >
              <Typography
                variant={variant === "compact" ? TYPOGRAPHY.B3 : TYPOGRAPHY.R3}
              >
                Delete app
              </Typography>
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
