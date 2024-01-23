import { useCallback, useMemo } from "react";

import {
  InsertActionMutationVariables,
  useInsertActionMutation,
} from "../graphql/insert-action.generated";

import { ActionsDocument } from "../graphql/actions.generated";
import { useAppStore } from "src/stores/appStore";
import { useRouter } from "next/router";

export const useInsertAction = () => {
  const currentApp = useAppStore.getState().currentApp;
  const router = useRouter();
  const team_id = router.query.team_id as string;

  const [insertActionQuery, other] = useInsertActionMutation({
    context: { headers: { team_id } },
  });

  const insertAction = useCallback(
    async (object: InsertActionMutationVariables) => {
      let result:
        | Awaited<ReturnType<typeof insertActionQuery>>
        | typeof other.error;

      try {
        result = await insertActionQuery({
          variables: object,
          refetchQueries: [
            {
              query: ActionsDocument,
              variables: { app_id: currentApp?.id ?? "" },
              context: { headers: { team_id } },
            },
          ],
        });
      } catch (error) {
        result = error as typeof other.error;
      }

      return result;
    },
    [currentApp?.id, insertActionQuery, other, team_id]
  );

  const result = useMemo(
    () => ({ insertAction, ...other }),
    [insertAction, other]
  );

  return result;
};
