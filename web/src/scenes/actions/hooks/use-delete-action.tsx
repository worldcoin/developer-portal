import { useCallback } from "react";
import { useDeleteActionMutation } from "../graphql/delete-action.generated";
import { DeleteActionMutationVariables } from "../graphql/delete-action.generated";
import { useAppStore } from "src/stores/appStore";
import { ActionsDocument } from "../graphql/actions.generated";

export const useDeleteAction = () => {
  const currentApp = useAppStore.getState().currentApp;

  const [deleteActionMutation, other] = useDeleteActionMutation();

  const deleteAction = useCallback(
    async (id: DeleteActionMutationVariables["id"]) => {
      deleteActionMutation({
        variables: { id },
        refetchQueries: [
          {
            query: ActionsDocument,
            variables: { app_id: currentApp?.id ?? "" },
          },
        ],
      });
    },
    [currentApp?.id, deleteActionMutation]
  );

  return { deleteAction, ...other };
};
