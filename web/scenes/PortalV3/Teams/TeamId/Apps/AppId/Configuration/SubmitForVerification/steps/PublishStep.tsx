"use client";

import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { MiniAppConfiguration } from "../../MiniAppConfiguration";
import { AppMetadata } from "../../AppStore/types/AppStoreFormTypes";

type PublishStepProps = {
  appId: string;
  teamId: string;
  appMetadata: AppMetadata;
};

/**
 * Step 6 — "Publish as a mini app?". Reuses the existing external-vs-mini-app
 * switch (<MiniAppConfiguration>). Submitting for review is handled by the
 * wizard footer, which drives the shared AppTopBar submit pipeline.
 */
export const PublishStep = ({
  appId,
  teamId,
  appMetadata,
}: PublishStepProps) => {
  return (
    <div className="grid gap-y-10">
      <div className="grid gap-y-2">
        <Typography variant={TYPOGRAPHY.H6} className="font-normal">
          Publish as a mini app?
        </Typography>
        <Typography variant={TYPOGRAPHY.R4} className="text-grey-500">
          Turn this on to list your app in the World App store after
          verification. You can change it while your app is unverified.
        </Typography>
      </div>

      <MiniAppConfiguration
        appId={appId}
        teamId={teamId}
        appMetadata={appMetadata}
      />

      <Typography variant={TYPOGRAPHY.R4} className="text-grey-500">
        When you submit for review your app enters verification. Approved apps
        go live automatically.
      </Typography>
    </div>
  );
};
