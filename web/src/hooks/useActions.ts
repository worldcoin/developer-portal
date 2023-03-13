import { ApolloError, gql } from "@apollo/client";
import { graphQLRequest } from "src/lib/frontend-api";
import { ActionModelWithNullifiers } from "@/lib/models";
import useSWR from "swr";
import useSWRMutation from "swr/mutation";
import { shallow } from "zustand/shallow";
import { useCallback } from "react";
import { toast } from "react-toastify";
import { IActionStore, useActionStore } from "src/stores/actionStore";
import { IAppStore, useAppStore } from "src/stores/appStore";

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
      nullifier_hash
  }
`;

const FetchActionsQuery = gql`
  query Actions($app_id: String!) {
    action(order_by: { created_at: asc }, where: { app_id: {_eq: $app_id}, action: { _neq: "" } }) {
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

const InsertActionMutation = gql`
  mutation InsertAction(
    $name: String!
    $description: String = ""
    $action: String = ""
    $app_id: String!
  ) {
    insert_action_one(
      object: {
        action: $action
        app_id: $app_id
        name: $name
        description: $description
      }
    ) {
        ${actionFields}
    }
  }
`;

const fetchActions = async (): Promise<Array<ActionModelWithNullifiers>> => {
  const currentApp = useAppStore.getState().currentApp;

  if (!currentApp) {
    throw new Error("App not found in state");
  }

  const response = await graphQLRequest<{
    action: Array<ActionModelWithNullifiers>;
  }>({
    query: FetchActionsQuery,
    variables: {
      app_id: currentApp.id,
    },
  });

  if (response.data?.action.length) {
    return response.data.action;
  }

  return [];
};

const updateActionFetcher = async (
  _key: [string, string | undefined],
  args: {
    arg: {
      id: ActionModelWithNullifiers["id"];
      name?: ActionModelWithNullifiers["name"];
      description?: ActionModelWithNullifiers["description"];
      kiosk_enabled?: ActionModelWithNullifiers["kiosk_enabled"];
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

const insertActionFetcher = async (_key: [string, string | undefined]) => {
  const currentApp = useAppStore.getState().currentApp;

  if (!currentApp) {
    throw new Error("App not found in state");
  }

  const { name, description, action } = useActionStore.getState().newAction;

  const response = await graphQLRequest<{
    insert_action_one: ActionModelWithNullifiers;
  }>(
    {
      query: InsertActionMutation,
      variables: {
        name,
        description,
        action,
        app_id: currentApp.id,
      },
    },
    true
  );

  if (response.data?.insert_action_one) {
    return response.data.insert_action_one;
  }
};

const getAppStore = (store: IAppStore) => ({
  currentApp: store.currentApp,
});

const getActionsStore = (store: IActionStore) => ({
  actions: store.actions,
  setActions: store.setActions,
  setNewAction: store.setNewAction,
  setNewIsOpened: store.setIsNewActionModalOpened,
});

const useActions = () => {
  const { currentApp } = useAppStore(getAppStore, shallow);

  const { actions, setActions, setNewIsOpened, setNewAction } = useActionStore(
    getActionsStore,
    shallow
  );

  const { data, error, isLoading } = useSWR<Array<ActionModelWithNullifiers>>(
    ["actions", currentApp?.id],
    fetchActions,
    {
      onSuccess: (data) => setActions(data),
    }
  );

  const { trigger: updateAction } = useSWRMutation(
    ["actions", currentApp?.id],
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

  const { trigger: insertAction } = useSWRMutation(
    ["actions", currentApp?.id],
    insertActionFetcher,
    {
      onSuccess: (data) => {
        if (data) {
          setActions([...actions, data]);
          setNewAction({ name: "", description: "", action: "" });
          setNewIsOpened(false);
          toast.success("Action created");
        }
      },
      onError: (err) => {
        if (
          err.graphQLErrors[0].extensions["code"] === "constraint-violation"
        ) {
          toast.error(
            'An action with this identifier already exists for this app. Please change the "action" identifier.'
          );
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

  const createNewAction = useCallback(() => {
    insertAction();
  }, [insertAction]);

  return {
    actions: data,
    error,
    isLoading,
    updateAction,
    updateName,
    updateDescription,
    toggleKiosk,
    createNewAction,
  };
};

export default useActions;
