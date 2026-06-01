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
    // Refetch matching observables only when the consumer invokes `refetch()`.
    //
    // The previous implementation called `client.refetchQueries({ include })`
    // inside a `useMemo` at hook-setup time. That had two side effects:
    //   1. Apollo emits "Unknown query named X" (3.14 code 43) when no
    //      active observable matches the document at that moment — common
    //      because the consumer that subscribes to the query may not have
    //      mounted yet when the hook owner mounts.
    //   2. `refetchQueries` itself triggers an immediate refetch on matching
    //      observables, so on every mount we silently re-fetched data —
    //      then on the user's action we fetched again. Two fetches per
    //      logical refetch.
    //
    // Calling it lazily here, with `onQueryUpdated` filtering by variables
    // (Apollo's idiomatic selector), preserves the original "refetch only
    // queries whose variables match" intent without the mount-time refetch
    // or the misleading warning.
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
