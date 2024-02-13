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
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { urls } from "@/lib/urls";
import clsx from "clsx";
import { useAtom } from "jotai";
import { useParams, useRouter } from "next/navigation";
import { useCallback } from "react";
import { createAppDialogOpenedAtom } from "../Header";

const colors = [
  "bg-blue-400",
  "bg-blue-500",
  "bg-blue-600",
  "bg-blue-700",
  "bg-grey-700",
  "bg-grey-900",
  "bg-system-success-400",
  "bg-system-success-500",
  "bg-system-success-600",
  "bg-system-success-700",
  "bg-system-success-800",
  "bg-system-success-900",
  "bg-system-error-500",
  "bg-system-error-600",
  "bg-system-error-700",
  "bg-system-error-800",
  "bg-system-error-900",
  "bg-additional-blue-500",
  "bg-additional-purple-500",
  "bg-additional-green-500",
  "bg-additional-sea-500",
  "bg-additional-orange-500",
  "bg-additional-pink-500",
  "bg-additional-lightOrange-500",
];

const Placeholder = (props: { name: string }) => {
  // Hash function I made up to create entropy
  const hash = props.name.split("").reduce((hash, char) => {
    return (hash << 5) - hash + char.charCodeAt(0);
  }, 0);
  const solidColor = colors[Math.abs(hash) % colors.length];
  return (
    <div
      className={clsx(
        "flex size-6 items-center justify-center rounded-lg",
        solidColor,
      )}
    >
      <div className="text-xs text-grey-0">{props.name[0]}</div>
    </div>
  );
};

export const AppSelector = () => {
  const router = useRouter();
  const { teamId, appId } = useParams() as { teamId?: string; appId?: string };
  const [_, setCreateAppDialogOpen] = useAtom(createAppDialogOpenedAtom);

  const { data, loading, error } = useFetchAppsQuery({
    context: { headers: { team_id: teamId } },
  });

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

  if (!data || loading || error || data.app.length === 0 || !teamId) {
    return null;
  }

  return (
    <Select
      value={data.app.find((app) => app.id === appId) ?? null}
      onChange={onChange}
      by={(
        a: FetchAppsQuery["app"][number],
        b: FetchAppsQuery["app"][number],
      ) => a?.id === b?.id}
    >
      <SelectButton>
        {({ value }: { value: FetchAppsQuery["app"][number] }) => (
          <div className="grid grid-cols-auto/1fr/auto items-center gap-x-2">
            <Placeholder name={value?.app_metadata[0].name ?? "Select app"} />

            <Typography variant={TYPOGRAPHY.R4}>
              {value?.app_metadata[0].name ?? "Select app"}
            </Typography>

            <div className="flex items-center justify-center rounded-full border border-grey-200 p-[3px]">
              <CaretIcon className="size-3" />
            </div>
          </div>
        )}
      </SelectButton>

      <SelectOptions className="max-w-[200px]">
        {data.app.map((app) => (
          <SelectOption key={app.id} value={app}>
            {({ selected }) => (
              <div className="grid grid-cols-auto/1fr/auto items-center gap-x-2 truncate">
                <Placeholder name={app?.app_metadata[0].name ?? "Select app"} />

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

        <SelectOption value={null}>
          <div className="grid grid-cols-auto/1fr/auto items-center gap-x-2">
            <PlusCircleIcon className="size-4 text-gray-500" />

            <Typography variant={TYPOGRAPHY.R4}>Create new app</Typography>
          </div>
        </SelectOption>
      </SelectOptions>
    </Select>
  );
};
