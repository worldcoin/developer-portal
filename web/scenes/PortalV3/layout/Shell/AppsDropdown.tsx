"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Role_Enum } from "@/graphql/graphql";
import { Auth0SessionUser } from "@/lib/types";
import { urls } from "@/lib/urls";
import { checkUserPermissions, cn } from "@/lib/utils";
import {
  FetchAppsDocument,
  FetchAppsQuery,
} from "@/scenes/common/layout/AppSelector/graphql/client/fetch-apps.generated";
import { Icon, opticalIconClassName } from "@/scenes/PortalV3/common/Icon";
import { useCreateAppDialog } from "@/scenes/common/layout/CreateAppDialog/useCreateAppDialog";
import { useQuery } from "@apollo/client/react";
import { useUser } from "@auth0/nextjs-auth0/client";
import { atom, useAtomValue, useSetAtom } from "jotai";
import { ChevronsUpDownIcon } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useMemo } from "react";
import {
  SearchableSwitcher,
  switcherTriggerClassName,
} from "./SearchableSwitcher";

type DropdownApp = { id: string; name: string };

const lastAppAtom = atom<{ teamId: string; appId: string } | undefined>(
  undefined,
);

export const useCurrentAppId = (): string | undefined => {
  const params = useParams<{ teamId?: string; appId?: string }>();
  const teamId = params?.teamId;
  const appId = params?.appId;
  const setLastApp = useSetAtom(lastAppAtom);
  const lastApp = useAtomValue(lastAppAtom);

  useEffect(() => {
    if (!teamId || !appId) return;
    setLastApp((previous) =>
      previous?.teamId === teamId && previous.appId === appId
        ? previous
        : { teamId, appId },
    );
  }, [teamId, appId, setLastApp]);

  if (appId) return appId;
  return lastApp && lastApp.teamId === teamId ? lastApp.appId : undefined;
};

const appName = (app: FetchAppsQuery["app"][number]) =>
  app.app_metadata?.[0]?.name ?? "Untitled app";

const AppAvatar = (props: { name: string }) => (
  <Avatar className="size-6">
    <AvatarFallback className="bg-[#d6f0d5] font-world text-[11px] leading-none font-normal text-[#00c230]">
      {props.name[0]?.toUpperCase() ?? "A"}
    </AvatarFallback>
  </Avatar>
);

export const AppsDropdown = () => {
  const { teamId } = useParams<{ teamId?: string; appId?: string }>();
  const { user } = useUser() as Auth0SessionUser;
  const canCreateApp = checkUserPermissions(user, teamId ?? "", [
    Role_Enum.Owner,
    Role_Enum.Admin,
  ]);
  const { open: openCreateAppDialog } = useCreateAppDialog();
  const currentAppId = useCurrentAppId();

  const { data, loading, error } = useQuery(FetchAppsDocument, {
    variables: { teamId: teamId! },
    skip: !teamId,
  });

  const apps = useMemo<DropdownApp[]>(() => {
    const list = data?.app ?? [];
    return list
      .map((app) => ({ id: app.id, name: appName(app) }))
      .sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
      );
  }, [data?.app]);

  const current = apps.find((app) => app.id === currentAppId);
  const currentLabel = current?.name ?? "All apps";
  const isUnavailable = loading || Boolean(error);
  const showEmptyAppRow = !loading && Boolean(data) && apps.length === 0;

  if (!teamId) return null;

  return (
    <SearchableSwitcher
      items={showEmptyAppRow ? [] : apps}
      selectedId={currentAppId}
      renderTrigger={(open) => (
        <Button
          variant="ghost"
          disabled={isUnavailable}
          aria-label="Switch app"
          aria-expanded={open}
          className={cn(
            switcherTriggerClassName,
            "text-portal-text hover:bg-portal-hover hover:text-portal-text disabled:cursor-default",
          )}
        >
          {current ? <AppAvatar name={current.name} /> : null}
          <span className="max-w-[260px] truncate">{currentLabel}</span>
          <ChevronsUpDownIcon className="size-4 text-portal-muted" />
        </Button>
      )}
      renderLeading={(app) => <AppAvatar name={app.name} />}
      getItemHref={(app) =>
        urls.worldId40({
          team_id: teamId,
          app_id: app.id,
        })
      }
      searchLabel="Find an app"
      listLabel="Apps"
      emptyLabel="No apps, yet"
      showEmptyState={showEmptyAppRow}
      emptyLeading={
        <span
          className={`${opticalIconClassName} flex size-6 items-center justify-center rounded-full bg-portal-canvas`}
        >
          <Icon name="apps-empty-icon" className="size-3.5" />
        </span>
      }
      noResultsLabel="No apps found"
      createAction={
        canCreateApp
          ? {
              label: "Create new app",
              onSelect: openCreateAppDialog,
            }
          : undefined
      }
      side="bottom"
      testIdPrefix="app"
    />
  );
};
