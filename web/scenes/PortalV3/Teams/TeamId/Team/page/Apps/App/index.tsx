"use client";

import { AppStatus, StatusVariant } from "@/components/AppStatus";
import { Button } from "@/components/Button";
import { TYPOGRAPHY } from "@/components/Typography";
import { urls } from "@/lib/urls";
import { FetchAppsQuery } from "@/scenes/common/Teams/TeamId/Team/page/Apps/graphql/client/fetch-apps.generated";
import {
  actionCardFrameClassName,
  actionCardTitleClassName,
} from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/WorldId/page/ActionCard";
import { useParams } from "next/navigation";
import { useMemo } from "react";
import { AppLogo } from "./AppLogo";

/** Card geometry, shared with the loading skeleton. */
export const appCardFrameClassName = `${actionCardFrameClassName} relative transition-shadow hover:shadow-portal-card`;

export const App = (props: { app: FetchAppsQuery["app"][number] }) => {
  const { teamId } = useParams() as { teamId: string };
  const app = useMemo(() => props.app, [props.app]);
  const metadata = useMemo(() => app.app_metadata?.[0], [app.app_metadata]);

  return (
    <Button
      href={urls.app({ team_id: teamId, app_id: app.id })}
      className={`${appCardFrameClassName} transition-colors hover:border-blue-500`}
    >
      <AppStatus
        status={metadata.verification_status as StatusVariant}
        className="absolute top-5 right-5 px-2 py-1"
        typography={TYPOGRAPHY.R5}
      />

      <AppLogo
        src={metadata.logo_img_url}
        name={metadata.name}
        appId={app.id}
        verification_status={metadata.verification_status as StatusVariant}
      />

      <div className="mt-auto min-w-0">
        <span className={`${actionCardTitleClassName} block truncate`}>
          {metadata.name}
        </span>
      </div>
    </Button>
  );
};
