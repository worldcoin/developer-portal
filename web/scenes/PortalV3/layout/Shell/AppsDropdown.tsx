"use client";

import { CaretIcon } from "@/components/Icons/CaretIcon";
import { Role_Enum } from "@/graphql/graphql";
import { Auth0SessionUser } from "@/lib/types";
import { urls } from "@/lib/urls";
import { checkUserPermissions } from "@/lib/utils";
import {
  FetchAppsQuery,
  useFetchAppsQuery,
} from "@/scenes/common/layout/AppSelector/graphql/client/fetch-apps.generated";
import { CreateAppDialogV4 } from "@/scenes/Portal/layout/CreateAppDialog/index-v4";
import { useUser } from "@auth0/nextjs-auth0/client";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import clsx from "clsx";
import { atom, useAtomValue, useSetAtom } from "jotai";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type DropdownApp = { id: string; name: string };

// Which app is "selected": the URL on app routes, otherwise the last app
// visited under this team — remembered so team-scoped routes (Members /
// API Keys / Settings, no appId in the URL) keep their app context. Keyed by
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

const AppsDropdownRow = (props: {
  app: DropdownApp;
  isSelected: boolean;
  onSelect: () => void;
}) => (
  <DropdownMenu.Item
    onSelect={props.onSelect}
    className={clsx(
      "flex cursor-pointer items-center gap-3 rounded-8 px-2.5 py-1.5 font-gta text-14 outline-none data-[highlighted]:bg-grey-100",
      props.isSelected && "font-medium",
    )}
  >
    <span className="truncate">{props.app.name}</span>
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
  const currentAppId = useCurrentAppId();

  const { data, loading, error } = useFetchAppsQuery({
    variables: { teamId: teamId! },
    skip: !teamId,
  });

  const apps = useMemo<DropdownApp[]>(() => {
    const list = data?.app ?? [];
    return [...list]
      .map((app) => ({ id: app.id, name: appName(app) }))
      .sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
      );
  }, [data?.app]);

  if (!teamId) return null;

  // Reserve the empty-state UI (Create app / No apps) for a confirmed-empty
  // result. While the query is loading or has errored (`data` still undefined),
  // render nothing rather than flashing an empty state or swallowing the error.
  if (loading || error || !data) return null;

  const current = apps.find((app) => app.id === currentAppId);

  return (
    <>
      {canCreateApp && (
        <CreateAppDialogV4 open={dialogOpen} onClose={setDialogOpen} />
      )}

      {apps.length === 0 ? (
        canCreateApp ? (
          <button
            onClick={() => setDialogOpen(true)}
            className="border-border text-muted-foreground hover:bg-muted focus-visible:ring-ring flex items-center gap-2 rounded-8 border px-2.5 py-1.5 font-gta text-14 font-medium outline-none focus-visible:ring-2"
          >
            Create app
          </button>
        ) : (
          <span className="border-border text-muted-foreground flex items-center gap-2 rounded-8 border px-2.5 py-1.5 font-gta text-14 font-medium">
            No apps
          </span>
        )
      ) : (
        <DropdownMenu.Root>
          <DropdownMenu.Trigger className="border-border hover:bg-muted focus-visible:ring-ring flex items-center gap-2 rounded-8 border px-2.5 py-1.5 font-gta text-14 font-medium outline-none focus-visible:ring-2">
            <span className="max-w-[220px] truncate">
              {current?.name ?? "Select app"}
            </span>
            <CaretIcon className="text-muted-foreground size-3" />
          </DropdownMenu.Trigger>

          <DropdownMenu.Portal>
            <DropdownMenu.Content
              align="start"
              sideOffset={6}
              className="border-border z-50 max-h-[60vh] min-w-[240px] overflow-y-auto rounded-12 border bg-white p-1 shadow-lg"
            >
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
              {canCreateApp && (
                <>
                  <DropdownMenu.Separator className="bg-border my-1 h-px" />
                  <DropdownMenu.Item
                    onSelect={() => setDialogOpen(true)}
                    className="text-muted-foreground flex cursor-pointer items-center gap-2 rounded-8 px-2.5 py-1.5 font-gta text-14 outline-none data-[highlighted]:bg-grey-100"
                  >
                    Create app
                  </DropdownMenu.Item>
                </>
              )}
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      )}
    </>
  );
};
