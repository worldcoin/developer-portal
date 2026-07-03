"use client";

import { AlertIcon } from "@/components/Icons/AlertIcon";
import { AppStatus, StatusVariant } from "@/components/AppStatus";
import { DecoratedButton } from "@/components/DecoratedButton";
import { SizingWrapper } from "@/components/SizingWrapper";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { AppMetadata } from "../AppStore/types/AppStoreFormTypes";

type SubmittedForReviewScreenProps = {
  appMetadata: AppMetadata;
  onUnsubmit: () => void;
  unsubmitLoading: boolean;
};

/**
 * Post-submission screen shown by <VerificationWizard> once the app enters
 * `awaiting_review`. Replaces the stepper/flow with a single-item list of the
 * app + its status, the "resubmit the form" disclaimer, and an Un-submit
 * action. Un-submitting returns the app to `unverified`, which makes the wizard
 * render the editable stepper again — positioned at the last step so the user
 * can immediately re-review and resubmit.
 */
export const SubmittedForReviewScreen = ({
  appMetadata,
  onUnsubmit,
  unsubmitLoading,
}: SubmittedForReviewScreenProps) => {
  return (
    <SizingWrapper variant="nav" gridClassName="order-4 pb-24 pt-10">
      <div className="grid max-w-[700px] gap-y-8">
        <div className="grid gap-y-2">
          <Typography variant={TYPOGRAPHY.H6} className="font-normal">
            Submitted for review
          </Typography>
          <Typography variant={TYPOGRAPHY.R4} className="text-grey-500">
            Your app is being reviewed. We&apos;ll notify you once it&apos;s
            approved or if we need changes.
          </Typography>
        </div>

        <ul className="grid gap-y-3">
          <li className="flex items-center justify-between gap-x-4 rounded-xl border border-grey-100 px-5 py-4">
            <div className="flex flex-col gap-y-1">
              <Typography variant={TYPOGRAPHY.M3} className="text-grey-900">
                {appMetadata.name}
              </Typography>
              <AppStatus
                status={appMetadata.verification_status as StatusVariant}
              />
            </div>
            <DecoratedButton
              type="button"
              variant="secondary"
              disabled={unsubmitLoading}
              onClick={onUnsubmit}
              className="h-11"
            >
              <Typography variant={TYPOGRAPHY.M3}>Un-submit</Typography>
            </DecoratedButton>
          </li>
        </ul>

        <div className="flex items-center gap-x-3 rounded-xl bg-system-warning-100 p-3">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-system-warning-600">
            <AlertIcon className="size-4 text-white" />
          </div>
          <Typography
            variant={TYPOGRAPHY.R4}
            className="text-system-warning-600"
          >
            Un-submitting returns your app to draft. You&apos;ll need to
            resubmit the form for review when you&apos;re ready.
          </Typography>
        </div>
      </div>
    </SizingWrapper>
  );
};
