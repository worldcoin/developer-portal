"use client";

import { Placeholder } from "@/components/PlaceholderImage";
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
import { ChevronsUpDownIcon, LayoutGridIcon } from "lucide-react";
import { useParams } from "next/navigation";
import { useMemo } from "react";
import { useNavigationAppContext } from "./NavigationContext";
import {
  SearchableSwitcher,
  switcherTriggerClassName,
} from "./SearchableSwitcher";

type DropdownApp = { id: string; name: string; isOverview?: boolean };

export const useCurrentAppId = (): string | undefined => {
  return useNavigationAppContext().appId;
};

const allAppsId = "__all_apps__";

const appName = (app: FetchAppsQuery["app"][number]) =>
  app.app_metadata?.[0]?.name ?? "Untitled app";

const AppAvatar = (props: DropdownApp) => (
  <Placeholder
    name={props.name}
    seed={props.id}
    className="size-6 shrink-0 rounded-full font-world text-[11px] leading-none font-normal"
  />
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

  const switcherItems = useMemo<DropdownApp[]>(
    () =>
      apps.length > 0
        ? [{ id: allAppsId, name: "All apps", isOverview: true }, ...apps]
        : [],
    [apps],
  );
  const current = apps.find((app) => app.id === currentAppId);
  const currentLabel = current?.name ?? "All apps";
  const isUnavailable = loading || Boolean(error);
  const showEmptyAppRow = !loading && Boolean(data) && apps.length === 0;

  if (!teamId) return null;

  return (
    <SearchableSwitcher
      items={switcherItems}
      selectedId={currentAppId ?? allAppsId}
      renderTrigger={(open) => (
        <Button
          variant="ghost"
          disabled={isUnavailable}
          aria-label="Switch app"
          aria-expanded={open}
          className={cn(
            switcherTriggerClassName,
            "text-portal-text hover:bg-portal-border hover:text-portal-text disabled:cursor-default",
          )}
        >
          {current ? <AppAvatar {...current} /> : null}
          <span className="max-w-[260px] truncate">{currentLabel}</span>
          <ChevronsUpDownIcon className="size-4 text-portal-muted" />
        </Button>
      )}
      renderLeading={(app) =>
        app.isOverview ? (
          <span className="flex size-6 items-center justify-center">
            <LayoutGridIcon
              className={`${opticalIconClassName} size-4 text-portal-muted`}
            />
          </span>
        ) : (
          <AppAvatar {...app} />
        )
      }
      getItemHref={(app) =>
        app.isOverview
          ? urls.teams({ team_id: teamId })
          : urls.worldId40({
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
