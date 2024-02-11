"use client";

import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { useFetchAppsQuery } from "./graphql/client/fetch-apps.generated";
import { useParams } from "next/navigation";
import { App } from "./App";
import { StatusVariant } from "@/components/AppStatus";
import Skeleton from "react-loading-skeleton";

export const Apps = () => {
  const { teamId } = useParams() as { teamId: string };

  const { data } = useFetchAppsQuery({
    context: { headers: { team_id: teamId } },
  });

  return (
    <div className="grid gap-y-8">
      <Typography variant={TYPOGRAPHY.H7}>Apps</Typography>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {data?.app.map((app) => <App key={app.id} app={app} />)}

        {!data?.app &&
          Array.from({ length: 4 }).map((_, index) => (
            <div key={index}>
              <Skeleton height={200} />
            </div>
          ))}
      </div>
    </div>
  );
};
