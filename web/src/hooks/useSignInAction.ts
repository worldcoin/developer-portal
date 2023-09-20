import { gql } from "@apollo/client";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { toast } from "react-toastify";
import { graphQLRequest } from "src/lib/frontend-api";
import { ActionModel, RedirectModel } from "src/lib/models";
import { IAppStore, useAppStore } from "src/stores/appStore";
import {
  ISignInActionStore,
  useSignInActionStore,
} from "src/stores/signInActionStore";
import useSWR from "swr";
import useSWRMutation from "swr/mutation";
import { shallow } from "zustand/shallow";

const actionFields = `
    id
    app_id
    status
    privacy_policy_uri
    terms_uri
`;

const FetchActionQuery = gql`
  query SignInAction($app_id: String!) {
    action(where: { app_id: {_eq: $app_id}, action: { _eq: "" } }) {
      ${actionFields}
    }
  }
`;

const UpdateActionMutation = gql`
  mutation UpdateAction($id: String!, $changes: action_set_input) {
    update_action_by_pk(pk_columns: { id: $id }, _set: $changes) {
      ${actionFields}
    }
  }
`;

const redirectFields = `
  id
  action_id
  redirect_uri
  created_at
  updated_at
`;

const FetchRedirectsQuery = gql`
  query Redirects($action_id: String!) {
    redirect(where: {action_id: {_eq: $action_id}},  order_by: {created_at: asc}) {
      ${redirectFields}
    }
  }
`;

const InsertRedirectMutation = gql`
  mutation InsertRedirect($action_id: String!) {
    insert_redirect_one(object: { action_id: $action_id, redirect_uri: "" }) {
      ${redirectFields}
    }
  }
`;

const UpdateRedirectMutation = gql`
  mutation UpdateRedirect($id: String!, $uri: String!) {
    update_redirect_by_pk(
      pk_columns: { id: $id }
      _set: { redirect_uri: $uri }
    ) {
      ${redirectFields}
    }
  }
`;

const DeleteRedirectMutation = gql`
  mutation DeleteRedirect($id: String!) {
    delete_redirect_by_pk(id: $id) {
      id
    }
  }
`;

const ResetClientSecretMutation = gql`
  mutation ResetClientSecret($app_id: String!) {
    reset_client_secret(app_id: $app_id) {
      client_secret
    }
  }
`;

const fetchAction = async (_key: [string, string | undefined]) => {
  const currentApp = useAppStore.getState().currentApp;

  if (!currentApp) {
    return null;
  }

  const response = await graphQLRequest<{
    action: Array<ActionModel>;
  }>({
    query: FetchActionQuery,
    variables: {
      app_id: currentApp.id,
    },
  });

  return response.data?.action?.[0] ?? null;
};

const updateActionFetcher = async (
  _key: [string, string | undefined],
  args: {
    arg: {
      changes: {
        status?: ActionModel["status"];
        terms_uri?: ActionModel["terms_uri"];
        privacy_policy_uri?: ActionModel["privacy_policy_uri"];
      };
    };
  }
) => {
  const { changes } = args.arg;
  const currentAction = useSignInActionStore.getState().action;

  if (!currentAction) {
    return null;
  }

  const response = await graphQLRequest<{
    update_action_by_pk: ActionModel;
  }>({
    query: UpdateActionMutation,
    variables: {
      id: currentAction.id,
      changes,
    },
  });

  if (response.data?.update_action_by_pk) {
    return response.data.update_action_by_pk;
  }

  throw new Error("Failed to update action");
};

const fetchRedirects = async () => {
  const currentAction = useSignInActionStore.getState().action;

  if (!currentAction) {
    return [];
  }

  const response = await graphQLRequest<{
    redirect: Array<RedirectModel>;
  }>({
    query: FetchRedirectsQuery,
    variables: {
      action_id: currentAction.id,
    },
  });

  if (response.data?.redirect) {
    return response.data.redirect;
  }

  throw new Error("Error fetching redirects");
};

const addRedirectFetcher = async (_key: [string, string | undefined]) => {
  const currentAction = useSignInActionStore.getState().action;

  if (!currentAction) {
    return;
  }

  const response = await graphQLRequest<{
    insert_redirect_one: RedirectModel;
  }>({
    query: InsertRedirectMutation,
    variables: {
      action_id: currentAction.id,
    },
  });

  if (response.data?.insert_redirect_one.id) {
    return response.data.insert_redirect_one;
  }

  throw new Error("Fieled to add redirect");
};

const updateRedirectFetcher = async (
  _key: [string, string | undefined],
  args: {
    arg: {
      id: RedirectModel["id"];
      uri: RedirectModel["redirect_uri"];
    };
  }
) => {
  const { id, uri } = args.arg;

  const response = await graphQLRequest<{
    update_redirect_by_pk: RedirectModel;
  }>({
    query: UpdateRedirectMutation,
    variables: {
      id,
      uri,
    },
  });

  if (response.data?.update_redirect_by_pk.id) {
    return response.data.update_redirect_by_pk;
  }

  throw new Error("Fieled to update redirect");
};

const deleteRedirectFetcher = async (
  _key: [string, string | undefined],
  args: { arg: { id: RedirectModel["id"] } }
) => {
  const { id } = args.arg;

  const response = await graphQLRequest<{
    delete_redirect_by_pk: Pick<RedirectModel, "id">;
  }>({
    query: DeleteRedirectMutation,
    variables: { id },
  });

  if (response.data?.delete_redirect_by_pk.id) {
    return response.data.delete_redirect_by_pk.id;
  }

  throw new Error("Fieled to delete redirect");
};

const resetClientSecretFetcher = async (_key: [string, string | undefined]) => {
  const currentApp = useAppStore.getState().currentApp;

  if (!currentApp) {
    return null;
  }

  const response = await graphQLRequest<{
    reset_client_secret: { client_secret: string };
  }>({
    query: ResetClientSecretMutation,
    variables: { app_id: currentApp.id },
  });

  if (response.data?.reset_client_secret.client_secret) {
    return response.data.reset_client_secret.client_secret;
  }

  throw new Error("Failed to reset client secret");
};

const getAppStore = (store: IAppStore) => ({
  currentApp: store.currentApp,
});

const getSignInActionStore = (store: ISignInActionStore) => ({
  currentAction: store.action,
  setAction: store.setAction,
  redirects: store.redirects,
  setRedirects: store.setRedirects,
  clientSecret: store.clientSecret,
  setClientSecret: store.setClientSecret,
});

const useSignInAction = () => {
  const { currentApp } = useAppStore(getAppStore, shallow);

  const {
    currentAction: _action,
    setAction,
    redirects: currentRedirects,
    setRedirects: setCurrentRedirects,
    clientSecret,
    setClientSecret,
  } = useSignInActionStore(getSignInActionStore, shallow);

  const {
    data: action,
    error: actionError,
    isLoading: actionIsLoading,
  } = useSWR<ActionModel | null>(
    ["signInAction", currentApp?.id],
    fetchAction,
    {
      onSuccess: (data) => setAction(data),
    }
  );

  const { trigger: updateAction } = useSWRMutation(
    ["signInAction", currentApp?.id],
    updateActionFetcher,
    {
      onSuccess: (data) => {
        if (data) {
          setAction(data);
          toast.success("Action updated");
        }
      },
    }
  );

  const {
    data: redirects,
    error: redirectsError,
    isLoading: redirectsIsLoading,
  } = useSWR<Array<RedirectModel>>(["redirect", _action?.id], fetchRedirects, {
    onSuccess: (data) => setCurrentRedirects(data),
  });

  const { trigger: addRedirect } = useSWRMutation(
    ["redirect", _action?.id],
    addRedirectFetcher,
    {
      onSuccess: (data) => {
        if (data) {
          setCurrentRedirects([...currentRedirects, data]);
          // TODO: do not save the redirect before the user populates the uri
          //toast.success("Redirect added");
        }
      },
    }
  );

  const { trigger: updateRedirect } = useSWRMutation(
    ["redirect", _action?.id],
    updateRedirectFetcher,
    {
      onSuccess: (updatedRedirect) => {
        if (updatedRedirect) {
          setCurrentRedirects(
            currentRedirects.map((redirect) =>
              redirect.id === updatedRedirect.id ? updatedRedirect : redirect
            )
          );

          toast.success("Redirect updated");
        }
      },
    }
  );

  const { trigger: deleteRedirect } = useSWRMutation(
    ["redirect", _action?.id],
    deleteRedirectFetcher,
    {
      onSuccess: (id) => {
        if (id) {
          setCurrentRedirects(
            currentRedirects.filter((redirect) => redirect.id !== id)
          );

          toast.success("Redirect deleted");
        }
      },
    }
  );

  const { trigger: resetClientSecret } = useSWRMutation(
    ["redirect", _action?.id],
    resetClientSecretFetcher,
    {
      onSuccess: (clientSecret) => {
        if (clientSecret) {
          setClientSecret(clientSecret);
          toast.success("Client secret has been reset");
        }
      },
    }
  );

  const router = useRouter();

  // NOTE: hide client secret on router history change
  useEffect(() => {
    router.events.on("beforeHistoryChange", () => setClientSecret(null));
  }, [router.events, setClientSecret]);

  return {
    action,
    actionError,
    actionIsLoading,
    updateAction,

    redirects,
    redirectsError,
    redirectsIsLoading,
    addRedirect,
    updateRedirect,
    deleteRedirect,

    clientSecret,
    resetClientSecret,
  };
};

export default useSignInAction;
