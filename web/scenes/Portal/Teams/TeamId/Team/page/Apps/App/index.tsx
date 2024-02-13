"use client";

import { AppStatus, StatusVariant } from "@/components/AppStatus";
import { Button } from "@/components/Button";
import { CloudIcon } from "@/components/Icons/CloudIcon";
import { LinkIcon } from "@/components/Icons/LinkIcon";
import { SmartPhoneIcon } from "@/components/Icons/SmartPhoneIcon";
import { StartUpIcon } from "@/components/Icons/StartUp";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { urls } from "@/lib/urls";
import clsx from "clsx";
import { useParams } from "next/navigation";
import { useMemo } from "react";
import { FetchAppsQuery } from "../graphql/client/fetch-apps.generated";
import { AppLogo } from "./AppLogo";

export const App = (props: { app: FetchAppsQuery["app"][number] }) => {
  const { teamId } = useParams() as { teamId: string };
  const app = useMemo(() => props.app, [props.app]);
  const metadata = useMemo(() => app.app_metadata?.[0], [app.app_metadata]);

  const environment = useMemo(
    () => (app.is_staging ? "staging" : "production"),
    [app.is_staging],
  );

  return (
    <Button
      href={urls.app({ team_id: teamId, app_id: app.id })}
      className="relative grid justify-items-center gap-y-4 rounded-20 border border-grey-200 px-8 pb-6 pt-10 transition-colors hover:border-blue-500"
    >
      <AppStatus
        status={metadata.verification_status as StatusVariant}
        className="absolute right-4 top-4 px-2 py-1"
        typography={TYPOGRAPHY.R5}
      />

      <AppLogo
        src={metadata.logo_img_url}
        name={metadata.name}
        appId={app.id}
        verification_status={metadata.verification_status as StatusVariant}
      />

      <div className="grid gap-y-1">
        <Typography variant={TYPOGRAPHY.M3} className="text-center">
          {metadata.name}
        </Typography>

        <div className="flex gap-x-4">
          <div className="flex flex-row gap-x-2 text-grey-400">
            {environment === "production" && (
              <StartUpIcon className="h-auto w-4" />
            )}

            {environment === "staging" && (
              <SmartPhoneIcon className="h-auto w-4" />
            )}

            <Typography variant={TYPOGRAPHY.R4} className={clsx("capitalize")}>
              {environment}
            </Typography>
          </div>

          <div className="h-4 w-px bg-grey-200" />

          <div className="flex flex-row gap-x-2 text-grey-400">
            {app.engine === "cloud" && <CloudIcon className="h-auto w-4" />}
            {app.engine === "on-chain" && <LinkIcon className="h-auto w-4" />}
            <Typography variant={TYPOGRAPHY.R4} className="capitalize">
              {app.engine}
            </Typography>
          </div>
        </div>
      </div>
    </Button>
  );
};
