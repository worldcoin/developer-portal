import { DocumentNode, useApolloClient } from "@apollo/client";
import { useCallback, useMemo } from "react";

export const useRefetchQueries = <Variables extends Record<string, unknown>>(
  queryDocument: DocumentNode,
  variables?: Variables,
) => {
  const client = useApolloClient();

  const { queries } = useMemo(
    () =>
      client.refetchQueries({
        include: [queryDocument],
      }),
    [queryDocument],
  );

  const queriesToRefetch = useMemo(
    () =>
      queries.filter(
        (q) =>
          JSON.stringify(q.options.variables) === JSON.stringify(variables),
      ),
    [queries, variables],
  );

  // may mask successful refetches if any fail
  const refetch = useCallback(async () => {
    return await Promise.all(queriesToRefetch.map((q) => q.refetch()));
  }, [queriesToRefetch]);

  return { refetch };
};
