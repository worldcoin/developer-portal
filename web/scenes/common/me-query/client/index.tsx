import { getNullifierName } from "@/lib/utils";
import { useUser } from "@auth0/nextjs-auth0/client";
import { useCallback, useEffect, useMemo } from "react";
import { updateSessionUser } from "../update-session";
import { useFetchMeQuery } from "./graphql/client/me-query.generated";

export const useMeQuery = (options?: Parameters<typeof useFetchMeQuery>[0]) => {
  const { checkSession } = useUser();
  const { data, ...rest } = useFetchMeQuery({ ...options });

  const updateSession = useCallback(async () => {
    if (!data?.user) {
      return;
    }

    await updateSessionUser(data.user[0]);
    await checkSession();
  }, [checkSession, data?.user]);

  useEffect(() => {
    if (!data || rest.loading) {
      return;
    }

    updateSession();
  }, [data, rest.loading, updateSession]);

  const fetchedUser = useMemo(() => data?.user?.[0], [data?.user]);

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

  return { user, ...rest };
};
