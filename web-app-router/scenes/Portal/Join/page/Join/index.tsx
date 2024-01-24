"use client";

import { useUser } from "@auth0/nextjs-auth0/client";
import { Fragment, Suspense } from "react";

export const Join = () => {
  const { user, isLoading } = useUser();

  return (
    <div className="grid">
      {isLoading && <div>Loading ...</div>}

      {!isLoading && user && (
        <Fragment>
          <span>Name: {user?.name}</span>
          <span>Email: {user?.email}</span>
          <span>auth0Id: {user?.sub}</span>
        </Fragment>
      )}
    </div>
  );
};
