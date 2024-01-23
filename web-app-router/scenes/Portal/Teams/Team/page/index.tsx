"use client";

import { useAppsQuery } from "./graphql/apps.generated";

export const TeamPage = () => {
  const { data, loading, error } = useAppsQuery();

  return (
    <div className="grid">
      <span>{`Loading: ${loading}`}</span>
      <span>{`Data: ${JSON.stringify(data)}`}</span>
      <span>{`Error: ${error}`}</span>
    </div>
  );
};
