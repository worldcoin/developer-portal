"use client";

import {
  Select,
  SelectButton,
  SelectOption,
  SelectOptions,
} from "@/components/Select";

import {
  FetchAppsQuery,
  useFetchAppsQuery,
} from "./graphql/client/fetch-apps.generated";

import { CaretIcon } from "@/components/Icons/CaretIcon";
import { CheckmarkCircleIcon } from "@/components/Icons/CheckmarkCircleIcon";
import { PlusCircleIcon } from "@/components/Icons/PlusCircleIcon";
import { Placeholder } from "@/components/PlaceholderImage";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { Role_Enum } from "@/graphql/graphql";
import { Auth0SessionUser } from "@/lib/types";
import { urls } from "@/lib/urls";
import { checkUserPermissions, getCDNImageUrl } from "@/lib/utils";
import { useUser } from "@auth0/nextjs-auth0/client";
import clsx from "clsx";
import { useAtom } from "jotai";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useMemo } from "react";
import { createAppDialogOpenedAtom } from "../Header";

export const AppSelector = () => {
  const router = useRouter();
  const { teamId, appId } = useParams() as { teamId?: string; appId?: string };
  const [_, setCreateAppDialogOpen] = useAtom(createAppDialogOpenedAtom);
  const { user } = useUser() as Auth0SessionUser;

  const isEnoughPermissions = useMemo(() => {
    return checkUserPermissions(user, teamId ?? "", [
      Role_Enum.Owner,
      Role_Enum.Admin,
    ]);
  }, [user, teamId]);

  const { data, loading, error } = useFetchAppsQuery({
    variables: { teamId: teamId! },
    skip: !teamId,
  });

  const sortedApps = useMemo(() => {
    if (!data?.app) return [];
    return [...data.app].sort((a, b) => {
      const nameA = a.app_metadata[0]?.name ?? "";
      const nameB = b.app_metadata[0]?.name ?? "";
      return nameA.localeCompare(nameB, undefined, { sensitivity: "base" });
    });
  }, [data?.app]);

  const onChange = useCallback(
    (app: FetchAppsQuery["app"][number] | null) => {
      // NOTE: null is value for "Create new app" option
      if (app === null) {
        return setCreateAppDialogOpen(true);
      }

      if (!teamId) {
        return;
      }

      router.push(urls.app({ team_id: teamId, app_id: app?.id }));
    },
    [router, setCreateAppDialogOpen, teamId],
  );

  if (!data || loading || error || sortedApps.length === 0 || !teamId) {
    return null;
  }

  return (
    <Select
      value={sortedApps.find((app) => app.id === appId) ?? null}
      onChange={onChange}
      by={(
        a: FetchAppsQuery["app"][number],
        b: FetchAppsQuery["app"][number],
      ) => a?.id === b?.id}
    >
      <SelectButton className={clsx({ hidden: !appId }, "px-0")}>
        {({ value }: { value: FetchAppsQuery["app"][number] }) => (
          <div className="grid max-w-[400px] grid-cols-auto/1fr/auto items-center gap-x-2 md:max-w-[200px]">
            {value?.verified_app_metadata?.[0]?.logo_img_url ? (
              // CDN urls should not use Next Image
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={
                  getCDNImageUrl(
                    appId ?? "",
                    value?.verified_app_metadata?.[0]?.logo_img_url,
                  ) ?? ""
                }
                alt="app logo"
                className="size-6 rounded-lg"
              />
            ) : (
              <Placeholder
                name={value?.app_metadata[0].name ?? "Select app"}
                className="size-6 text-xs"
              />
            )}

            <Typography variant={TYPOGRAPHY.R4} className="truncate">
              {value?.app_metadata[0].name ?? "Select app"}
            </Typography>

            <div className="flex items-center justify-center rounded-full border border-grey-200 p-[3px]">
              <CaretIcon className="size-3" />
            </div>
          </div>
        )}
      </SelectButton>

      <SelectOptions className="max-h-[50vh] max-w-[200px]">
        {sortedApps.map((app) => (
          <SelectOption key={app.id} value={app}>
            {({ selected }) => (
              <div className="grid grid-cols-auto/1fr/auto items-center gap-x-2 truncate">
                {app?.verified_app_metadata?.[0]?.logo_img_url ? (
                  // CDN urls should not use Next Image
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={
                      getCDNImageUrl(
                        app.id,
                        app?.verified_app_metadata?.[0]?.logo_img_url,
                      ) ?? ""
                    }
                    alt="app logo"
                    className="size-6 rounded-lg"
                  />
                ) : (
                  <Placeholder
                    name={app?.app_metadata[0].name ?? "Select app"}
                    className="size-6 text-xs"
                  />
                )}
                <span className="truncate text-grey-900">
                  <Typography
                    variant={selected ? TYPOGRAPHY.M4 : TYPOGRAPHY.R4}
                  >
                    {app?.app_metadata[0].name ?? "Select app"}
                  </Typography>
                </span>

                {selected && <CheckmarkCircleIcon className="text-blue-500" />}
              </div>
            )}
          </SelectOption>
        ))}
        {isEnoughPermissions && (
          <SelectOption value={null}>
            <div className="grid grid-cols-auto/1fr/auto items-center gap-x-2">
              <PlusCircleIcon className="size-4 text-gray-500" />

              <Typography variant={TYPOGRAPHY.R4}>Create new app</Typography>
            </div>
          </SelectOption>
        )}
      </SelectOptions>
    </Select>
  );
};
