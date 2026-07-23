"use client";

import { Button } from "@/components/Button";
import { AddCircleIcon } from "@/components/Icons/AddCircleIcon";
import { MagnifierIcon } from "@/components/Icons/MagnifierIcon";
import { Input } from "@/components/Input";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { App } from "./App";
import { AppCardSkeleton } from "./App/Skeleton";
import { useQuery } from "@apollo/client/react";
import {
  FetchAppsDocument,
  FetchAppsQuery,
} from "@/scenes/common/Teams/TeamId/Team/page/Apps/graphql/client/fetch-apps.generated";
import { Section } from "@/components/Section";
import { PlusIcon } from "@/components/Icons/PlusIcon";
import { DecoratedButton } from "@/components/DecoratedButton";
import { useAtom } from "jotai";
import { createAppDialogOpenedAtom } from "@/scenes/common/layout/Header/atoms";

export const Apps = () => {
  const { teamId } = useParams() as { teamId: string };
  const [_, setCreateAppDialogOpen] = useAtom(createAppDialogOpenedAtom);

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
    <Section>
      <Section.Header>
        <Section.Header.Title>Apps</Section.Header.Title>

        <Section.Header.Search className="md:col-span-2">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            type="search"
            label=""
            addOnLeft={<MagnifierIcon className="text-grey-400" />}
            placeholder="Search app by name"
            className="w-full px-4 py-2"
          />
        </Section.Header.Search>

        <Section.Header.Button className="z-10 md:hidden">
          <DecoratedButton
            type="button"
            variant="primary"
            className="min-w-[200px] py-2.5"
            onClick={() => setCreateAppDialogOpen(true)}
          >
            <PlusIcon className="size-5" />
            New app
          </DecoratedButton>
        </Section.Header.Button>
      </Section.Header>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {!loading &&
          filteredApps?.map((app: FetchAppsQuery["app"][number]) => (
            <App key={app.id} app={app} />
          ))}

        {!loading && searchQuery && filteredApps?.length === 0 && (
          <div className="col-span-full flex h-[200px] items-center justify-center rounded-2xl border border-grey-200">
            <Typography variant={TYPOGRAPHY.R3} className="text-grey-400">
              No apps found
            </Typography>
          </div>
        )}

        {loading &&
          !app &&
          Array.from({ length: 4 }).map((_, index) => (
            <AppCardSkeleton key={index} />
          ))}

        {!loading && app && !searchQuery && (
          <Button
            className="group relative flex flex-col items-center justify-center gap-y-4 rounded-20 border border-dashed border-grey-200 px-8 pt-10 pb-6 transition-colors hover:border-blue-500 max-md:hidden"
            type="button"
            onClick={() => setCreateAppDialogOpen(true)}
          >
            <AddCircleIcon className="size-8 text-grey-500 transition-colors group-hover:text-blue-500" />
            <Typography
              variant={TYPOGRAPHY.M3}
              className="text-center text-grey-500 transition-colors group-hover:text-blue-500"
            >
              Create an app
            </Typography>
          </Button>
        )}
      </div>
    </Section>
  );
};
