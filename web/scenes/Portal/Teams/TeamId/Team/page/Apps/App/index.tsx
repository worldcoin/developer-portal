"use client";

import { AppStatus, StatusVariant } from "@/components/AppStatus";
import { Button } from "@/components/Button";
import { Environment } from "@/components/Environment";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { urls } from "@/lib/urls";
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
          <Environment environment={environment} engine={app.engine} />
        </div>
      </div>
    </Button>
  );
};
