import { useAppStore } from "src/stores/appStore";
import { useActionsQuery } from "../graphql/actions.generated";
import { useMemo } from "react";
import { useRouter } from "next/router";

export const useFetchActions = () => {
  const currentApp = useAppStore.getState().currentApp;
  const router = useRouter();
  const team_id = router.query.team_id as string;

  const { data, loading: isActionsLoading } = useActionsQuery({
    context: { headers: { team_id } },
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
