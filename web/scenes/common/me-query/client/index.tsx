import { Auth0SessionUser } from "@/lib/types";
import { getNullifierName } from "@/lib/utils";
import { useUser } from "@auth0/nextjs-auth0/client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@apollo/client/react";
import { FetchMeDocument } from "./graphql/client/me-query.generated";

export const useMeQuery = () => {
  const { user: auth0User } = useUser() as Auth0SessionUser;
  const [updating, setUpdating] = useState(true);
  const { invalidate } = useUser();

  // `invalidate` from useUser() is a new function reference on every render.
  // Keep the latest in a ref and call it via the ref so `updateSession` below
  // stays referentially stable — depending on `invalidate` directly would
  // recreate updateSession each render and re-run the effect in a loop
  // (POST /api/update-session + profile refetch on every render).
  const invalidateRef = useRef(invalidate);
  invalidateRef.current = invalidate;

  const {
    data,
    loading: fetchLoading,
    ...rest
  } = useQuery(FetchMeDocument, {
    variables: { userId: auth0User?.hasura?.id! },
    skip: !auth0User?.hasura?.id,
  });

  const updateSession = useCallback(async () => {
    if (!data?.user_by_pk) {
      return;
    }

    let updateResult: boolean | null = null;

    try {
      const res = await fetch("/api/update-session", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({ user: data.user_by_pk }),
      });

      if (!res.ok) {
        console.error("Error updating session", res);
      }

      const updateData = await res.json();
      updateResult = updateData.success;
    } catch (error) {
      console.error("Error updating session", error);
    }

    if (!updateResult) {
      return;
    }

    await invalidateRef.current();
  }, [data?.user_by_pk]);

  useEffect(() => {
    if (!data || fetchLoading) {
      return;
    }

    setUpdating(true);
    updateSession().then(() => setUpdating(false));
  }, [data, fetchLoading, updateSession]);

  const fetchedUser = useMemo(() => data?.user_by_pk, [data?.user_by_pk]);

  const loading = useMemo(
    () => updating || fetchLoading,
    [fetchLoading, updating],
  );

  const user = useMemo(
    () => ({
      ...fetchedUser,
      nameToDisplay:
        fetchedUser?.name ||
        fetchedUser?.email ||
        getNullifierName(fetchedUser?.world_id_nullifier) ||
        "Anonymous User",
    }),
    [fetchedUser],
  );

  return { user, loading, ...rest };
};
