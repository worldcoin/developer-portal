"use client";

import { SearchIcon } from "@/components/Icons/SearchIcon";
import { Input } from "@/components/Input";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { useQuery } from "@apollo/client/react";
import {
  FetchAppsDocument,
  FetchAppsQuery,
} from "@/scenes/common/Teams/TeamId/Team/page/Apps/graphql/client/fetch-apps.generated";
import { useCreateAppDialog } from "@/scenes/common/layout/CreateAppDialog/useCreateAppDialog";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { App } from "./App";
import { AppCardSkeleton } from "./App/Skeleton";
import { CreateAppTile } from "./CreateAppTile";

export const Apps = () => {
  const { teamId } = useParams() as { teamId: string };
  const { open: openCreateAppDialog } = useCreateAppDialog();

  const { data, refetch, loading } = useQuery(FetchAppsDocument, {
    variables: { teamId },
    skip: !teamId,
  });

  useEffect(() => {
    if (data) {
      refetch();
    }
  }, [data, refetch, teamId]);

  const app = data?.app;

  const [searchQuery, setSearchQuery] = useState("");

  const filteredApps = useMemo(
    () =>
      app?.filter((a: FetchAppsQuery["app"][number]) =>
        (a.app_metadata?.[0]?.name ?? "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase()),
      ),
    [app, searchQuery],
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-2 border-b border-portal-border sm:min-h-[49px]">
        <h1 className="border-b-2 border-portal-heading px-1 pb-3 font-world text-13 text-portal-heading">
          Apps
        </h1>

        <div className="w-full pb-2 sm:w-64">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            type="search"
            label=""
            aria-label="Search apps"
            addOnLeft={<SearchIcon className="mx-2 text-grey-400" />}
            placeholder="Search apps"
            className="h-10 w-full py-0 text-sm"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {!searchQuery ? <CreateAppTile onClick={openCreateAppDialog} /> : null}

        {!loading &&
          filteredApps?.map((app: FetchAppsQuery["app"][number]) => (
            <App key={app.id} app={app} />
          ))}

        {!loading && searchQuery && filteredApps?.length === 0 && (
          <div className="col-span-full flex min-h-[144px] items-center justify-center rounded-[10px] border border-portal-border">
            <Typography variant={TYPOGRAPHY.R3} className="text-portal-muted">
              No apps found
            </Typography>
          </div>
        )}

        {loading &&
          !app &&
          Array.from({ length: 4 }).map((_, index) => (
            <AppCardSkeleton key={index} />
          ))}
      </div>
    </div>
  );
};
