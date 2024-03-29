import { Auth0SessionUser } from "@/lib/types";
import { getNullifierName } from "@/lib/utils";
import { useUser } from "@auth0/nextjs-auth0/client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useFetchMeQuery } from "./graphql/client/me-query.generated";

export const useMeQuery = (options?: Parameters<typeof useFetchMeQuery>[0]) => {
  const { user: auth0User } = useUser() as Auth0SessionUser;
  const [updating, setUpdating] = useState(true);
  const { checkSession } = useUser();

  const {
    data,
    loading: fetchLoading,
    ...rest
  } = useFetchMeQuery({
    variables: { userId: auth0User?.hasura?.id! },
    skip: !auth0User?.hasura?.id,
    ...options,
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

    await checkSession();
  }, [checkSession, data?.user_by_pk]);

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
