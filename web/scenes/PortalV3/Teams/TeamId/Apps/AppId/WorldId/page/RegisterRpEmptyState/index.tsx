"use client";

import { DecoratedButton } from "@/components/DecoratedButton";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { CreateAppDialogV4 } from "@/scenes/PortalV3/layout/CreateAppDialog/index-v4";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export const RegisterRpEmptyState = (props: {
  appId: string;
  initialOpen?: boolean;
  isStaging: boolean;
  canManageWorldId: boolean;
  onRegistered: () => void;
  onSetupClosed: (completed: boolean) => void;
  legacyActionsHref?: string;
}) => {
  const canEnable = !props.isStaging && props.canManageWorldId;
  const [open, setOpen] = useState(Boolean(props.initialOpen) && canEnable);
  const completedRef = useRef(false);

  useEffect(() => {
    if (props.initialOpen && canEnable) setOpen(true);
  }, [props.initialOpen, canEnable]);

  const closeDialog = () => {
    const completed = completedRef.current;
    completedRef.current = false;
    setOpen(false);
    props.onRegistered();
    props.onSetupClosed(completed);
  };

  return (
    <div className="flex flex-col items-center justify-center gap-6 py-20 text-center">
      <div className="flex flex-col items-center gap-2">
        <Typography variant={TYPOGRAPHY.H6}>Set up World ID</Typography>
        <Typography variant={TYPOGRAPHY.R4} className="max-w-md text-grey-500">
          {props.isStaging
            ? "World ID isn't available for staging apps."
            : !props.canManageWorldId
              ? "Ask a team owner or admin to enable World ID."
              : "Register a Relying Party to start requesting World ID verifications for this app."}
        </Typography>
      </div>

      {canEnable ? (
        <DecoratedButton
          type="button"
          variant="primary"
          onClick={() => setOpen(true)}
        >
          Enable World ID
        </DecoratedButton>
      ) : null}

      {props.legacyActionsHref ? (
        <Link
          href={props.legacyActionsHref}
          className="font-world text-13 text-portal-muted underline transition-colors hover:text-portal-ink"
        >
          Looking for your World ID 3.0 legacy actions?
        </Link>
      ) : null}

      {open ? (
        <CreateAppDialogV4
          open={open}
          initialStep="enable-world-id-4-0"
          appId={props.appId}
          onComplete={() => {
            completedRef.current = true;
          }}
          onClose={closeDialog}
        />
      ) : null}
    </div>
  );
};
