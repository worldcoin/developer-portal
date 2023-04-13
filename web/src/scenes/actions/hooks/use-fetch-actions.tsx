import { useAppStore } from "src/stores/appStore";
import { useActionsQuery } from "../graphql/actions.generated";
import { useMemo } from "react";

export const useFetchActions = () => {
  const currentApp = useAppStore.getState().currentApp;

  const { data, loading: isActionsLoading } = useActionsQuery({
    variables: { app_id: currentApp?.id ?? "" },
  });

  const result = useMemo(
    () => ({
      actions: data?.action,
      isActionsLoading,
    }),
    [data?.action, isActionsLoading]
  );

  return result;
};
