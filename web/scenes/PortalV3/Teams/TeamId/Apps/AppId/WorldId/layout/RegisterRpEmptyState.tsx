"use client";

import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { generateRpIdString } from "@/lib/rp";
import { RegisterRpButton } from "./RegisterRpButton";
import { SummaryField } from "./SummaryField";

export const RegisterRpEmptyState = (props: {
  appId: string;
  initialOpen?: boolean;
  isStaging: boolean;
  canManageWorldId: boolean;
  onRegistered: () => Promise<void>;
  onSetupClosed: (completed: boolean) => void;
}) => {
  const canRegister = !props.isStaging && props.canManageWorldId;
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
                <RegisterRpButton
                  appId={props.appId}
                  initialOpen={props.initialOpen}
                  onRegistered={props.onRegistered}
                  onSetupClosed={props.onSetupClosed}
                  disabled={!canRegister}
                  className="h-9 shrink-0"
                  aria-describedby={
                    unavailableReason
                      ? "world-id-registration-unavailable-reason"
                      : undefined
                  }
                >
                  Register relying party
                </RegisterRpButton>
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
    </>
  );
};
