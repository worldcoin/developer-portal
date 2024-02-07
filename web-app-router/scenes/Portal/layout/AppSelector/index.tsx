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

import { useParams } from "next/navigation";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { CaretIcon } from "@/components/Icons/CaretIcon";
import { CheckmarkCircleIcon } from "@/components/Icons/CheckmarkCircleIcon";
import { PlusCircleIcon } from "@/components/Icons/PlusCircleIcon";
import { urls } from "@/lib/urls";
import { createAppDialogOpenedAtom } from "../Header";
import { useAtom } from "jotai";
import { useRouter } from "next/navigation";
import { useCallback } from "react";

const Placeholder = (props: { name: string }) => {
  return (
    <div className="w-6 h-6 flex justify-center items-center bg-grey-100 rounded-lg">
      <div className="text-grey-500 text-xs">{props.name[0]}</div>
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
            <Placeholder name={value?.app_metadata[0].name ?? "Select team"} />

            <Typography variant={TYPOGRAPHY.R4}>
              {value?.app_metadata[0].name ?? "Select team"}
            </Typography>

            <div className="border border-grey-200 rounded-full flex justify-center items-center p-[3px]">
              <CaretIcon className="w-3 h-3" />
            </div>
          </div>
        )}
      </SelectButton>

      <SelectOptions className="max-w-[200px]">
        {data.app.map((app) => (
          <SelectOption key={app.id} value={app}>
            {({ selected }) => (
              <div
                // href={urls.app({ team_id: teamId, app_id: app.id })}
                className="grid grid-cols-auto/1fr/auto items-center gap-x-2 truncate"
              >
                <Placeholder name={app?.app_metadata[0].name ?? "Select app"} />

                <span className="truncate text-grey-900">
                  <Typography
                    variant={selected ? TYPOGRAPHY.M4 : TYPOGRAPHY.R4}
                  >
                    {app?.app_metadata[0].name ?? "Select team"}
                  </Typography>
                </span>

                {selected && <CheckmarkCircleIcon className="text-blue-500" />}
              </div>
            )}
          </SelectOption>
        ))}

        <SelectOption value={null}>
          <div className="grid grid-cols-auto/1fr/auto items-center gap-x-2">
            <PlusCircleIcon className="text-gray-500 w-4 h-4" />

            <Typography variant={TYPOGRAPHY.R4}>Create new app</Typography>
          </div>
        </SelectOption>
      </SelectOptions>
    </Select>
  );
};
