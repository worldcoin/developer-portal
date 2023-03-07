import { gql } from "@apollo/client";
import { graphQLRequest } from "src/lib/frontend-api";
import { ActionModel } from "@/lib/models";
import useSWR from "swr";
import useSWRMutation from "swr/mutation";
import { shallow } from "zustand/shallow";
import { useCallback } from "react";
import { toast } from "react-toastify";
import {
  ActionModelWithNullifiers,
  IActionStore,
  useActionStore,
} from "src/stores/actionStore";

const actionFields = `
id
app_id
action
created_at
creation_mode
description
external_nullifier
kiosk_enabled
name
max_accounts_per_user
max_verifications
updated_at
nullifiers {
    id
    created_at
}
`;

const FetchActionsQuery = gql`
  query Actions {
    action(order_by: { created_at: asc }, where: { action: { _neq: "" } }) {
      ${actionFields}
    }
  }
`;

const UpdateActionMutation = gql`
  mutation UpdateAction(
    $id: String!
    $name: String!
    $description: String!
    $kiosk_enabled: Boolean!
  ) {
    update_action_by_pk(
      pk_columns: { id: $id }
      _set: {
        name: $name
        description: $description
        kiosk_enabled: $kiosk_enabled
      }
    ) {
        ${actionFields}
    }
  }
`;

const fetchActions = async (): Promise<Array<ActionModelWithNullifiers>> => {
  const response = await graphQLRequest<{
    action: Array<ActionModelWithNullifiers>;
  }>({
    query: FetchActionsQuery,
  });

  if (response.data?.action.length) {
    return response.data.action;
  }

  return [];
};

const updateActionFetcher = async (
  _key: string,
  args: {
    arg: {
      id: ActionModel["id"];
      name?: ActionModel["name"];
      description?: ActionModel["description"];
      kiosk_enabled?: ActionModel["kiosk_enabled"];
    };
  }
) => {
  const { id, name, description, kiosk_enabled } = args.arg;

  const currentAction = useActionStore
    .getState()
    .actions.find((action) => action.id === id);

  if (!currentAction) {
    throw new Error("Action not found in state");
  }

  const response = await graphQLRequest<{
    update_action_by_pk: ActionModelWithNullifiers;
  }>({
    query: UpdateActionMutation,
    variables: {
      id: id,
      name: name ?? currentAction.name,
      description: description ?? currentAction.description,
      kiosk_enabled: kiosk_enabled ?? currentAction.kiosk_enabled,
    },
  });

  if (response.data?.update_action_by_pk) {
    return response.data.update_action_by_pk;
  }

  throw new Error("Failed to update app status");
};

const getStore = (store: IActionStore) => ({
  actions: store.actions,
  setActions: store.setActions,
});

const useActions = () => {
  const { actions, setActions } = useActionStore(getStore, shallow);

  const { data, error, isLoading } = useSWR<Array<ActionModelWithNullifiers>>(
    "actions",
    fetchActions,
    {
      onSuccess: (data) => setActions(data),
    }
  );

  const { trigger: updateAction } = useSWRMutation(
    "actions",
    updateActionFetcher,
    {
      onSuccess: (data) => {
        if (data) {
          const newActions = actions.map((action) =>
            action.id === data.id ? data : action
          );

          setActions(newActions);
          toast.success("Action updated");
        }
      },
    }
  );

  const updateName = useCallback(
    (id: string, name: string) => {
      const currentAction = actions.find((action) => action.id === id);

      if (!currentAction) {
        return;
      }

      updateAction({
        id,
        name,
      });
    },
    [actions, updateAction]
  );

  const updateDescription = useCallback(
    (id: string, description: string) => {
      const currentAction = actions.find((action) => action.id === id);

      if (!currentAction) {
        return;
      }

      updateAction({
        id,
        description,
      });
    },
    [actions, updateAction]
  );

  const toggleKiosk = useCallback(
    (id: string) => {
      const currentAction = actions.find((action) => action.id === id);

      if (!currentAction) {
        return;
      }

      updateAction({
        id,
        kiosk_enabled: !currentAction.kiosk_enabled,
      });
    },
    [actions, updateAction]
  );

  return {
    actions: data,
    error,
    isLoading,
    updateAction,
    updateName,
    updateDescription,
    toggleKiosk,
  };
};

export default useActions;
