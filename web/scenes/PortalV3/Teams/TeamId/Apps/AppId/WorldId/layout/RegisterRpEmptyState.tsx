"use client";

import { DecoratedButton } from "@/components/DecoratedButton";
import { SpinnerIcon } from "@/components/Icons/SpinnerIcon";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

// Show a fallback while an initially open dialog loads. Mimics the dialog
// overlay so the modal doesn't pop in from an undimmed page.
const EnableWorldIdDialog = dynamic(
  () =>
    import(
      "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/EnableWorldId40/Dialog"
    ).then((module) => module.EnableWorldIdDialog),
  {
    loading: () => (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[15px]">
        <SpinnerIcon className="size-6 animate-spin text-white" />
      </div>
    ),
  },
);

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
  // Keep the dialog mounted after its first open so FormDialog can play its
  // leave transition and reset its wizard state in afterLeave.
  const [hasOpened, setHasOpened] = useState(open);
  const completedRef = useRef(false);

  useEffect(() => {
    if (props.initialOpen && canEnable) {
      setOpen(true);
      setHasOpened(true);
    }
  }, [props.initialOpen, canEnable]);

  const closeDialog = () => {
    const completed = completedRef.current;
    completedRef.current = false;
    setOpen(false);
    props.onRegistered();
    props.onSetupClosed(completed);
  };

  return (
    <section className="flex flex-col items-start justify-between gap-5 rounded-xl border border-grey-100 bg-white p-5 sm:flex-row sm:items-center">
      <div>
        <Typography as="h2" variant={TYPOGRAPHY.S2}>
          Set up World ID
        </Typography>
        <Typography
          as="p"
          variant={TYPOGRAPHY.R4}
          className="mt-1 max-w-2xl text-grey-500"
        >
          {props.isStaging
            ? "World ID isn't available for staging apps."
            : !props.canManageWorldId
              ? "Ask a team owner or admin to enable World ID."
              : "Register a Relying Party to start requesting World ID verifications for this app."}
        </Typography>
        {props.legacyActionsHref ? (
          <Link
            href={props.legacyActionsHref}
            className="mt-2 inline-block font-world text-13 text-portal-muted underline transition-colors hover:text-portal-ink"
          >
            Looking for your World ID 3.0 legacy actions?
          </Link>
        ) : null}
      </div>

      {canEnable ? (
        <DecoratedButton
          type="button"
          variant="primary"
          className="shrink-0"
          onClick={() => {
            setOpen(true);
            setHasOpened(true);
          }}
        >
          Enable World ID
        </DecoratedButton>
      ) : null}

      {hasOpened ? (
        <EnableWorldIdDialog
          open={open}
          appId={props.appId}
          onComplete={() => {
            completedRef.current = true;
          }}
          onClose={closeDialog}
        />
      ) : null}
    </section>
  );
};
