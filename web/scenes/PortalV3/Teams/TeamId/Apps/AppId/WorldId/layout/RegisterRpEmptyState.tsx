"use client";

import { SpinnerIcon } from "@/components/Icons/SpinnerIcon";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { generateRpIdString } from "@/lib/rp";
import { InkButton } from "@/scenes/PortalV3/common/InkButton";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { SummaryField } from "./SummaryField";

// Show a fallback while an initially open dialog loads. Mimics the dialog
// overlay so the modal doesn't pop in from an undimmed page.
const RegisterRpDialog = dynamic(
  () =>
    import(
      "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/EnableWorldId40/Dialog"
    ).then((module) => module.RegisterRpDialog),
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
  onRegistered: () => Promise<void>;
  onSetupClosed: (completed: boolean) => void;
}) => {
  const canRegister = !props.isStaging && props.canManageWorldId;
  const [open, setOpen] = useState(Boolean(props.initialOpen) && canRegister);
  // Keep the dialog mounted after its first open so FormDialog can play its
  // leave transition and reset its wizard state in afterLeave.
  const [hasOpened, setHasOpened] = useState(open);
  const completedRef = useRef(false);

  useEffect(() => {
    if (props.initialOpen && canRegister) {
      setOpen(true);
      setHasOpened(true);
    }
  }, [props.initialOpen, canRegister]);

  const closeDialog = () => {
    const completed = completedRef.current;
    completedRef.current = false;
    setOpen(false);
    props.onSetupClosed(completed);
  };

  const unavailableReason = props.isStaging
    ? "RP registration is not available for staging apps."
    : !props.canManageWorldId
      ? "Ask a team owner or admin to register this relying party."
      : null;

  return (
    <>
      <section
        aria-label="World ID configuration"
        className="flex w-full max-w-[580px] flex-col gap-4"
      >
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-5">
            <SummaryField label="App ID" value={props.appId} copy />
            <SummaryField
              label="RP ID"
              value={generateRpIdString(props.appId)}
              copy
            />
            <div className="w-full min-w-0">
              <Typography variant={TYPOGRAPHY.B4} className="text-grey-500">
                Signer address
              </Typography>
              <div className="mt-1 flex flex-col items-start gap-2">
                <InkButton
                  type="button"
                  disabled={!canRegister}
                  className="h-9 shrink-0"
                  aria-describedby={
                    unavailableReason
                      ? "world-id-registration-unavailable-reason"
                      : undefined
                  }
                  onClick={() => {
                    setOpen(true);
                    setHasOpened(true);
                  }}
                >
                  Register relying party
                </InkButton>
                {unavailableReason ? (
                  <Typography
                    id="world-id-registration-unavailable-reason"
                    as="p"
                    variant={TYPOGRAPHY.B4}
                    className="text-grey-500"
                  >
                    {unavailableReason}
                  </Typography>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </section>

      {hasOpened ? (
        <RegisterRpDialog
          open={open}
          appId={props.appId}
          onComplete={async () => {
            completedRef.current = true;
            await props.onRegistered();
          }}
          onClose={closeDialog}
        />
      ) : null}
    </>
  );
};
