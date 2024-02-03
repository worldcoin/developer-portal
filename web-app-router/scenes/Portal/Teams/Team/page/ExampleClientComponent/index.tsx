"use client";

import { useUser } from "@auth0/nextjs-auth0/client";
import { useAppsQuery } from "./graphql/client/apps.generated";
import { inspect } from "util";
import { Auth0SessionUser } from "@/lib/types";
import { useSearchParams } from "next/navigation";

export const ExampleClientComponent = () => {
  const { user } = useUser() as Auth0SessionUser;
  const searchParams = useSearchParams();
  const team_id = searchParams?.get("team_id");

  const { data, loading, error } = useAppsQuery({
    context: { headers: { team_id } },
  });

  return (
    <div className="grid gap-y-4">
      <div className="w-full border-b-2 border-dashed" />

      <div>
        <h3 className="text-2xl">Apps (clientFetch): </h3>

        <pre>{inspect({ data, loading, error }, { depth: 10 })}</pre>
      </div>

      <div className="w-full border-b-2 border-dashed" />

      <pre>USER: {inspect(user, { depth: 10 })}</pre>
    </div>
  );
};
