"use client";

import { Button } from "@/components/Button";
import { AddCircleIcon } from "@/components/Icons/AddCircleIcon";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { urls } from "@/lib/urls";
import { useParams } from "next/navigation";
import { useEffect } from "react";
import Skeleton from "react-loading-skeleton";
import { App } from "./App";
import { useFetchAppsQuery } from "./graphql/client/fetch-apps.generated";

export const Apps = () => {
  const { teamId } = useParams() as { teamId: string };

  const { data, refetch, loading } = useFetchAppsQuery({
    context: { headers: { team_id: teamId } },
  });

  useEffect(() => {
    if (data) {
      refetch();
    }
  }, [data, refetch, teamId]);

  const app = data?.app;

  return (
    <div className="grid gap-y-8">
      <Typography variant={TYPOGRAPHY.H7}>Apps</Typography>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {!loading && app?.map((app) => <App key={app.id} app={app} />)}

        {loading &&
          !app &&
          Array.from({ length: 4 }).map((_, index) => (
            <div key={index}>
              <Skeleton height={200} />
            </div>
          ))}

        {!loading && app && app.length === 0 && (
          <Button
            className="group relative flex flex-col items-center justify-center gap-y-4 rounded-20 border border-dashed border-grey-200 px-8 pb-6 pt-10 transition-colors hover:border-blue-500"
            href={urls.apps({ team_id: teamId })}
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
    </div>
  );
};
