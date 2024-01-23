import { useAppStore } from "src/stores/appStore";
import { ActionsDocument } from "../graphql/actions.generated";
import { useCallback, useMemo } from "react";

import {
  useUpdateActionMutation,
  UpdateActionMutationVariables,
} from "../graphql/update-action.generated";

import { toast } from "react-toastify";
import { useRouter } from "next/router";

export const useUpdateAction = () => {
  const currentApp = useAppStore.getState().currentApp;
  const router = useRouter();
  const team_id = router.query.team_id as string;

  const [updateActionQuery, other] = useUpdateActionMutation({
    context: { headers: { team_id } },
    refetchQueries: [
      {
        query: ActionsDocument,
        variables: { app_id: currentApp?.id ?? "" },
        context: { headers: { team_id } },
      },
    ],
    onCompleted: (query) => {
      toast.success(
        `Action "${query.update_action_by_pk?.name ?? ""}" updated!`,
        { autoClose: 1500 }
      );
    },
  });

  const updateAction = useCallback(
    (id: string, input: UpdateActionMutationVariables["input"]) => {
      updateActionQuery({
        variables: {
          id,
          input,
        },
      });
    },
    [updateActionQuery]
  );

  const result = useMemo(
    () => ({
      updateAction,
      ...other,
    }),
    [other, updateAction]
  );

  return result;
};
