"use client";

import {
  FetchAppsQuery,
  useFetchAppsQuery,
} from "@/scenes/Portal/layout/AppSelector/graphql/client/fetch-apps.generated";
import { useParams } from "next/navigation";
import { useMemo } from "react";
import { AppSwitcher, AppSwitcherApp } from "./AppSwitcher";

const appName = (app: FetchAppsQuery["app"][number]) =>
  app.app_metadata?.[0]?.name ?? "Untitled app";

/**
 * Data wrapper for AppSwitcher — reuses the existing FetchApps query and maps
 * it to the presentational component's props. Kept thin and out of unit tests
 * (the Apollo query is mocked at the boundary in shell tests).
 */
export const AppSwitcherContainer = () => {
  const { teamId, appId } = useParams() as { teamId?: string; appId?: string };

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

  return <AppSwitcher teamId={teamId} currentAppId={appId} apps={apps} />;
};
