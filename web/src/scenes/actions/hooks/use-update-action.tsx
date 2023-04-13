import { useAppStore } from "src/stores/appStore";
import { ActionsDocument } from "../graphql/actions.generated";
import { useCallback, useMemo } from "react";

import {
  useUpdateActionMutation,
  UpdateActionMutationVariables,
} from "../graphql/update-action.generated";

import { toast } from "react-toastify";

export const useUpdateAction = () => {
  const currentApp = useAppStore.getState().currentApp;

  const [updateActionQuery, other] = useUpdateActionMutation({
    refetchQueries: [
      { query: ActionsDocument, variables: { app_id: currentApp?.id ?? "" } },
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
