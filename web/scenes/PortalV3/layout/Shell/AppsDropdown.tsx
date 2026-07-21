"use client";

import { Role_Enum } from "@/graphql/graphql";
import { Auth0SessionUser } from "@/lib/types";
import { urls } from "@/lib/urls";
import { checkUserPermissions } from "@/lib/utils";
import {
  FetchAppsQuery,
  useFetchAppsQuery,
} from "@/scenes/common/layout/AppSelector/graphql/client/fetch-apps.generated";
import { Icon, opticalIconClassName } from "@/scenes/PortalV3/common/Icon";
import { useUser } from "@auth0/nextjs-auth0/client";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { atom, useAtomValue, useSetAtom } from "jotai";
import dynamic from "next/dynamic";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type DropdownApp = { id: string; name: string };

const CreateAppDialogV4 = dynamic(() =>
  import("@/scenes/PortalV3/layout/CreateAppDialog/index-v4").then(
    (module) => module.CreateAppDialogV4,
  ),
);

// Which app is "selected": the URL on app routes, otherwise the last app
// visited under this team — remembered so team-scoped routes (Team settings,
// no appId in the URL) keep their app context. Keyed by
// team so an app remembered under one team is never used under another.
// SidebarNav reads this too, so its deep links always match the app name
// shown in the dropdown trigger.
const lastAppAtom = atom<{ teamId: string; appId: string } | undefined>(
  undefined,
);

export const useCurrentAppId = (): string | undefined => {
  const params = useParams<{ teamId?: string; appId?: string }>();
  const teamId = params?.teamId;
  const appId = params?.appId;
  const setLastApp = useSetAtom(lastAppAtom);
  const lastApp = useAtomValue(lastAppAtom);

  // Updated in an effect, not during render; identity-guarded because every
  // shell component using this hook runs the same sync.
  useEffect(() => {
    if (!teamId || !appId) return;
    setLastApp((prev) =>
      prev?.teamId === teamId && prev?.appId === appId
        ? prev
        : { teamId, appId },
    );
  }, [teamId, appId, setLastApp]);

  if (appId) return appId;
  return lastApp && lastApp.teamId === teamId ? lastApp.appId : undefined;
};

const appName = (app: FetchAppsQuery["app"][number]) =>
  app.app_metadata?.[0]?.name ?? "Untitled app";

const AppAvatar = (props: { name: string; className?: string }) => (
  <div
    className={`flex shrink-0 items-center justify-center rounded-full bg-[#d6f0d5] font-world text-[11px] leading-none font-normal text-[#00c230] ${props.className ?? ""}`}
  >
    {props.name[0]?.toUpperCase() ?? "A"}
  </div>
);

const AppsDropdownRow = (props: {
  app: DropdownApp;
  isSelected: boolean;
  onSelect: () => void;
}) => (
  <DropdownMenu.Item
    onSelect={props.onSelect}
    className="flex h-12 w-full cursor-pointer items-center gap-2 rounded-8 bg-white px-4 py-2 font-world text-13 leading-[1.2] font-medium text-portal-text outline-hidden data-highlighted:bg-grey-50"
  >
    <AppAvatar name={props.app.name} className="size-6" />
    <span className="min-w-0 flex-1 truncate">{props.app.name}</span>
    {props.isSelected ? (
      <Icon
        name="dropdown-check"
        className={`${opticalIconClassName} size-4`}
      />
    ) : null}
  </DropdownMenu.Item>
);

export const AppsDropdown = () => {
  const router = useRouter();
  const { teamId } = useParams() as { teamId?: string };
  const { user } = useUser() as Auth0SessionUser;
  const canCreateApp = checkUserPermissions(user, teamId ?? "", [
    Role_Enum.Owner,
    Role_Enum.Admin,
  ]);
  const [dialogOpen, setDialogOpen] = useState(false);
  // Keep mounted after first open to preserve transitions and state.
  const [dialogMounted, setDialogMounted] = useState(false);
  const currentAppId = useCurrentAppId();

  const { data, loading, error } = useFetchAppsQuery({
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

  if (!teamId) return null;

  const current = apps.find((app) => app.id === currentAppId);
  const currentLabel = current?.name ?? "All projects";
  const isUnavailable = loading || Boolean(error);
  const showEmptyAppRow = !loading && data && apps.length === 0;

  return (
    <>
      {canCreateApp && dialogMounted ? (
        <CreateAppDialogV4 open={dialogOpen} onClose={setDialogOpen} />
      ) : null}

      <DropdownMenu.Root>
        <DropdownMenu.Trigger
          disabled={isUnavailable}
          className="flex h-6 min-w-0 items-center gap-2 rounded-8 font-world text-13 leading-none font-medium text-portal-text outline-hidden transition-colors hover:text-portal-muted focus-visible:ring-2 focus-visible:ring-grey-300 disabled:cursor-default disabled:opacity-60"
        >
          {current ? (
            <AppAvatar name={current.name} className="size-6" />
          ) : null}
          <span className="max-w-[260px] truncate">{currentLabel}</span>
          <Icon
            name="arrow-separate-vertical"
            className={`${opticalIconClassName} size-4`}
          />
        </DropdownMenu.Trigger>

        <DropdownMenu.Portal>
          <DropdownMenu.Content
            align="start"
            sideOffset={16}
            className="z-50 max-h-[60vh] w-[279px] overflow-y-auto rounded-[10px] border border-portal-border bg-white p-0 shadow-[0_18px_11px_0_rgba(24,24,24,0.02),0_8px_8px_0_rgba(24,24,24,0.03),0_2px_4px_0_rgba(24,24,24,0.03)]"
          >
            <div className="flex w-full flex-col items-start py-2">
              {showEmptyAppRow ? (
                <DropdownMenu.Item
                  disabled
                  className="flex h-12 w-full cursor-default items-center gap-2 rounded-8 bg-white px-4 py-2 font-world text-13 leading-[1.2] font-medium text-portal-muted outline-hidden"
                >
                  <span
                    className={`${opticalIconClassName} flex size-6 items-center justify-center rounded-full bg-portal-canvas`}
                  >
                    <Icon name="apps-empty-icon" className="size-3.5" />
                  </span>
                  <span className="min-w-0 flex-1 truncate">No apps, yet</span>
                </DropdownMenu.Item>
              ) : null}

              {apps.map((app) => (
                <AppsDropdownRow
                  key={app.id}
                  app={app}
                  isSelected={app.id === currentAppId}
                  onSelect={() =>
                    router.push(urls.app({ team_id: teamId, app_id: app.id }))
                  }
                />
              ))}

              {canCreateApp ? (
                <>
                  <Icon
                    name="generic-divider"
                    className="h-2 w-full shrink-0"
                  />
                  <DropdownMenu.Item
                    onSelect={() => {
                      setDialogMounted(true);
                      setDialogOpen(true);
                    }}
                    className="flex h-12 w-full cursor-pointer items-center gap-2 rounded-8 bg-white px-4 py-2 font-world text-13 leading-[1.2] font-medium text-portal-text outline-hidden data-highlighted:bg-grey-50"
                  >
                    {/* Bare 16px icon per Figma (2123:1919): icons left-align
                        at the row padding; text columns differ per row. */}
                    <Icon
                      name="dropdown-plus"
                      className={`${opticalIconClassName} size-4`}
                    />
                    <span className="min-w-0 flex-1 truncate">
                      Create new app
                    </span>
                  </DropdownMenu.Item>
                </>
              ) : null}
            </div>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </>
  );
};
