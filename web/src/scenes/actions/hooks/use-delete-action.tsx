import { useCallback } from "react";
import { useDeleteActionMutation } from "../graphql/delete-action.generated";
import { DeleteActionMutationVariables } from "../graphql/delete-action.generated";
import { useAppStore } from "src/stores/appStore";
import { ActionsDocument } from "../graphql/actions.generated";
import { useRouter } from "next/router";

export const useDeleteAction = () => {
  const currentApp = useAppStore.getState().currentApp;
  const router = useRouter();
  const team_id = router.query.team_id as string;

  const [deleteActionMutation, other] = useDeleteActionMutation();

  const deleteAction = useCallback(
    async (id: DeleteActionMutationVariables["id"]) => {
      deleteActionMutation({
        context: { headers: { team_id } },
        variables: { id },
        refetchQueries: [
          {
            query: ActionsDocument,
            variables: { app_id: currentApp?.id ?? "" },
            context: { headers: { team_id } },
          },
        ],
      });
    },
    [currentApp?.id, deleteActionMutation, team_id]
  );

  return { deleteAction, ...other };
};
