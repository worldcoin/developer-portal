"use client";

import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { FetchAppMetadataQuery } from "@/scenes/common/Teams/TeamId/Apps/AppId/Configuration/graphql/client/fetch-app-metadata.generated";
import { MutableRefObject } from "react";
import {
  BasicInformation,
  BasicInformationHandle,
} from "../../BasicInformation";

type UrlsStepProps = {
  appId: string;
  teamId: string;
  app: FetchAppMetadataQuery["app"][0];
  teamName: string;
  basicInfoRef: MutableRefObject<BasicInformationHandle | null>;
};

/**
 * Step 4 — landing page + App URL. Reuses <BasicInformation> wholesale (app URL,
 * website, name, status, preview QR). The wizard keeps this step mounted so the
 * ref-based review validation still runs when submitting from the final step.
 */
export const UrlsStep = ({
  appId,
  teamId,
  app,
  teamName,
  basicInfoRef,
}: UrlsStepProps) => {
  return (
    <div className="grid gap-y-10">
      <div className="grid gap-y-2">
        <Typography variant={TYPOGRAPHY.H6} className="font-normal">
          Landing page &amp; App URL
        </Typography>
        <Typography variant={TYPOGRAPHY.R4} className="text-grey-500">
          Mini apps need an App URL so we can load them inside World App.
        </Typography>
      </div>

      <BasicInformation
        ref={basicInfoRef}
        appId={appId}
        teamId={teamId}
        app={app}
        teamName={teamName}
      />
    </div>
  );
};
