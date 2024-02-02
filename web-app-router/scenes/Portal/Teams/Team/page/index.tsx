"use client";

import { useUser } from "@auth0/nextjs-auth0/client";
import { useAppsQuery } from "./graphql/apps.generated";
import { SizingWrapper } from "@/components/SizingWrapper";

export const TeamPage = () => {
  const { data, loading, error } = useAppsQuery();
  const { user } = useUser();

  return (
    <SizingWrapper>
      <div className="grid">
        <span>{`Loading: ${loading}`}</span>
        <span>{`Data: ${JSON.stringify(data)}`}</span>
        <span>{`Error: ${error}`}</span>

        <hr className="bg-grey-900 text-grey-900 w-full h-1" />

        <p>USER: {JSON.stringify(user)}</p>
      </div>
    </SizingWrapper>
  );
};
