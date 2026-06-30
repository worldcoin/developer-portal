"use client";

import { CaretIcon } from "@/components/Icons/CaretIcon";
import { Role_Enum } from "@/graphql/graphql";
import { Auth0SessionUser } from "@/lib/types";
import { urls } from "@/lib/urls";
import { checkUserPermissions } from "@/lib/utils";
import {
  FetchAppsQuery,
  useFetchAppsQuery,
} from "@/scenes/Portal/layout/AppSelector/graphql/client/fetch-apps.generated";
import { CreateAppDialogV4 } from "@/scenes/Portal/layout/CreateAppDialog/index-v4";
import { useUser } from "@auth0/nextjs-auth0/client";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import clsx from "clsx";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

type DropdownApp = { id: string; name: string };

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
      "data-[highlighted]:bg-muted flex cursor-pointer items-center gap-3 rounded-8 px-2.5 py-1.5 font-gta text-14 outline-none",
      props.isSelected && "font-medium",
    )}
  >
    <span className="truncate">{props.app.name}</span>
  </DropdownMenu.Item>
);

export const AppsDropdown = () => {
  const router = useRouter();
  const { teamId, appId } = useParams() as { teamId?: string; appId?: string };
  const { user } = useUser() as Auth0SessionUser;
  const canCreateApp = checkUserPermissions(user, teamId ?? "", [
    Role_Enum.Owner,
    Role_Enum.Admin,
  ]);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Remember the last selected app so its name still shows in the trigger on
  // team-scoped routes (Members / API Keys / Settings) that have no appId in
  // the URL. Updated in an effect, not during render.
  const lastAppIdRef = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (appId) lastAppIdRef.current = appId;
  }, [appId]);
  const currentAppId = appId ?? lastAppIdRef.current;

  const { data } = useFetchAppsQuery({
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
            className="border-border text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-ring flex items-center gap-2 rounded-8 border px-2.5 py-1.5 font-gta text-14 font-medium outline-none focus-visible:ring-2"
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
          <DropdownMenu.Trigger className="border-border text-foreground hover:bg-muted focus-visible:ring-ring flex items-center gap-2 rounded-8 border px-2.5 py-1.5 font-gta text-14 font-medium outline-none focus-visible:ring-2">
            <span className="max-w-[220px] truncate">
              {current?.name ?? "Select app"}
            </span>
            <CaretIcon className="text-muted-foreground size-3" />
          </DropdownMenu.Trigger>

          <DropdownMenu.Portal>
            <DropdownMenu.Content
              align="start"
              sideOffset={6}
              className="border-border bg-card text-foreground z-50 max-h-[60vh] min-w-[240px] overflow-y-auto rounded-12 border p-1 shadow-lg"
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
                    className="text-muted-foreground data-[highlighted]:bg-muted data-[highlighted]:text-foreground flex cursor-pointer items-center gap-2 rounded-8 px-2.5 py-1.5 font-gta text-14 outline-none"
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
