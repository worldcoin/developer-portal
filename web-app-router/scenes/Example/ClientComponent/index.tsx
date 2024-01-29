"use client";

import { useUserQuery } from "../graphql/client/user.generated";

export const ClientComponent = () => {
  const data = useUserQuery();

  return (
    <div>
      <h1>Client Component</h1>
    </div>
  );
};
