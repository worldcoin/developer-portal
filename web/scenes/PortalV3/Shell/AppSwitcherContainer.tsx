"use client";

import {
  FetchAppsForSwitcherQuery,
  useFetchAppsForSwitcherQuery,
} from "@/lib/apps/fetch-apps-for-switcher";
import { urls } from "@/lib/urls";
import { useParams } from "next/navigation";
import { useMemo, useRef } from "react";
import { AppSwitcher, AppSwitcherApp } from "./AppSwitcher";

const appName = (app: FetchAppsForSwitcherQuery["app"][number]) =>
  app.app_metadata?.[0]?.name ?? "Untitled app";

export const AppSwitcherContainer = () => {
  const { teamId, appId } = useParams() as { teamId?: string; appId?: string };
  const lastAppIdRef = useRef<string | undefined>(appId);
  if (appId) lastAppIdRef.current = appId;
  const currentAppId = appId ?? lastAppIdRef.current;

  const { data } = useFetchAppsForSwitcherQuery({ teamId });

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
    <AppSwitcher
      teamId={teamId}
      currentAppId={currentAppId}
      apps={apps}
      onCreateApp={() => {
        window.location.assign(urls.apps({ team_id: teamId }));
      }}
    />
  );
};
