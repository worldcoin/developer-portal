import { DocumentNode, useApolloClient } from "@apollo/client";
import { useCallback, useMemo } from "react";

export const useRefetchQueries = <Variables extends Record<string, unknown>>(
  queryDocument: DocumentNode,
  variables?: Variables,
) => {
  const client = useApolloClient();
  const variablesKey = useMemo(
    () => JSON.stringify(variables || {}),
    [variables],
  );

  const refetch = useCallback(async () => {
    const { results } = client.refetchQueries({
      include: [queryDocument],
      onQueryUpdated(observableQuery) {
        return (
          JSON.stringify(observableQuery.options.variables) === variablesKey
        );
      },
    });
    return await Promise.all(results);
  }, [client, queryDocument, variablesKey]);

  return { refetch };
};
