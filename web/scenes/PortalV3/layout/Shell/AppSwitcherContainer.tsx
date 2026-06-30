"use client";

import {
  FetchAppsQuery,
  useFetchAppsQuery,
} from "@/scenes/Portal/layout/AppSelector/graphql/client/fetch-apps.generated";
import { CreateAppDialogV4 } from "@/scenes/Portal/layout/CreateAppDialog/index-v4";
import { useParams } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { AppSwitcher, AppSwitcherApp } from "./AppSwitcher";

const appName = (app: FetchAppsQuery["app"][number]) =>
  app.app_metadata?.[0]?.name ?? "Untitled app";

export const AppSwitcherContainer = (props: { canCreateApp?: boolean }) => {
  const { canCreateApp = false } = props;
  const { teamId, appId } = useParams() as { teamId?: string; appId?: string };
  // Keep showing the last selected app when navigating to team-scope routes
  // (Members, API Keys, Settings) that don't have an appId in the URL.
  const lastAppIdRef = useRef<string | undefined>(appId);
  if (appId) lastAppIdRef.current = appId;
  const currentAppId = appId ?? lastAppIdRef.current;
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data } = useFetchAppsQuery({
    variables: { teamId: teamId! },
    skip: !teamId,
  });

  const apps = useMemo<AppSwitcherApp[]>(() => {
    const list = data?.app ?? [];
    return [...list]
      .map((app) => ({ id: app.id, name: appName(app) }))
      .sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
      );
  }, [data?.app]);

  if (!teamId) return null;

  return (
    <>
      {/* Only mount the create dialog for members who can actually create. */}
      {canCreateApp ? (
        <CreateAppDialogV4 open={dialogOpen} onClose={setDialogOpen} />
      ) : null}
      <AppSwitcher
        teamId={teamId}
        currentAppId={currentAppId}
        apps={apps}
        canCreateApp={canCreateApp}
        onCreateApp={canCreateApp ? () => setDialogOpen(true) : undefined}
      />
    </>
  );
};
