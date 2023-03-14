import { AppModel } from "@/lib/models";
import { gql } from "@apollo/client";
import { useRouter } from "next/router";
import { useCallback } from "react";
import { toast } from "react-toastify";
import { graphQLRequest } from "src/lib/frontend-api";
import { AppStatusType } from "src/lib/types";
import { urls } from "src/lib/urls";
import { IAppStore, useAppStore } from "src/stores/appStore";
import useSWR from "swr";
import useSWRMutation from "swr/mutation";
import { shallow } from "zustand/shallow";

const appFields = `
id
logo_url
name
is_verified
engine
is_staging
status
description_internal
`;

const FetchAppsQuery = gql`
  query Apps {
    app(order_by: { created_at: asc }) {
      ${appFields}
    }
  }
`;

const UpdateAppQuery = gql`
  mutation UpdateApp(
    $id: String = ""
    $name: String
    $status: String
    $description_internal: String = ""
  ) {
    update_app_by_pk(
      pk_columns: { id: $id }
      _set: {
        status: $status
        name: $name
        description_internal: $description_internal
      }
    ) {
      ${appFields}
    }
  }
`;

const InsertAppQuery = gql`
  mutation InsertApp($object: app_insert_input!) {
    insert_app_one(object: $object) {
      ${appFields}
    }
  }
`;

const DeleteAppQuery = gql`
  mutation DeleteApp($id: String!) {
    app: delete_app_by_pk(id: $id) {
      id
    }
  }
`;

const fetchApps = async () => {
  const response = await graphQLRequest<{
    app: Array<AppModel>;
  }>({
    query: FetchAppsQuery,
  });

  if (response.data?.app.length) {
    return response.data.app;
  }
  return [];
};

const updateAppFetcher = async (
  _key: string,
  args: {
    arg: {
      id: AppModel["id"];
      name?: AppModel["name"];
      status?: AppModel["status"];
      description_internal?: AppModel["description_internal"];
    };
  }
) => {
  const currentApp = useAppStore.getState().currentApp;
  const { id, name, status, description_internal } = args.arg;

  if (!currentApp) {
    throw new Error("No current app");
  }

  const response = await graphQLRequest<{
    update_app_by_pk: AppModel;
  }>({
    query: UpdateAppQuery,
    variables: {
      id: id,
      name: name ?? currentApp.name,
      status: status ?? currentApp.status,

      description_internal:
        description_internal ?? currentApp.description_internal,
    },
  });

  if (response.data?.update_app_by_pk) {
    return response.data.update_app_by_pk;
  }

  throw new Error("Failed to update app status");
};

const deleteAppFetcher = async (
  _key: string,
  args: {
    arg: {
      id: AppModel["id"];
    };
  }
) => {
  const { id } = args.arg;
  const response = await graphQLRequest<{
    app: Pick<AppModel, "id">;
  }>({
    query: DeleteAppQuery,
    variables: { id },
  });
  if (response.data?.app) {
    return response.data?.app;
  }
  throw Error("Could not delete app");
};

type NewAppPayload = Pick<
  AppModel,
  "name" | "description_internal" | "engine" | "is_staging"
>;

const insertAppFetcher = async (_key: string, args: { arg: NewAppPayload }) => {
  const { name, description_internal, engine, is_staging } = args.arg;

  const response = await graphQLRequest<{
    insert_app_one: AppModel;
  }>({
    query: InsertAppQuery,
    variables: {
      object: {
        name,
        description_internal,
        engine,
        is_staging,
      },
    },
  });

  if (response.data?.insert_app_one) {
    return response.data.insert_app_one;
  }

  throw new Error("Failed to update app status");
};

const getStore = (store: IAppStore) => ({
  currentApp: store.currentApp,
  setApps: store.setApps,
  setCurrentApp: store.setCurrentApp,
});

const useApps = () => {
  const { currentApp, setApps, setCurrentApp } = useAppStore(getStore, shallow);
  const router = useRouter();

  const { data, error, isLoading } = useSWR<Array<AppModel>>("app", fetchApps, {
    onSuccess: (data) => {
      if (data.length) {
        setApps(data);
      }
    },
  });

  const { trigger: updateApp } = useSWRMutation("app", updateAppFetcher, {
    onSuccess: (data) => {
      if (data) {
        setCurrentApp(data);
        toast.success("App updated");
      }
    },
  });

  const toggleAppActivityMutation = useSWRMutation("app", updateAppFetcher, {
    onSuccess: (data) => {
      if (data) {
        setCurrentApp(data);
        toast.success("App name updated");
      }
    },
  });

  const updateAppNameMutation = useSWRMutation("app", updateAppFetcher, {
    onSuccess: (data) => {
      if (data) {
        setCurrentApp(data);
        toast.success("App name updated");
      }
    },
  });

  const updateAppDescriptionMutation = useSWRMutation("app", updateAppFetcher, {
    onSuccess: (data) => {
      if (data) {
        setCurrentApp(data);
        toast.success("App description updated");
      }
    },
  });

  const removeAppMutation = useSWRMutation("app", deleteAppFetcher, {
    onSuccess: (data) => {
      if (data) {
        setCurrentApp(null);
        toast.success("App deleted");
        router.replace("/app");
      }
    },
  });

  const toggleAppActivity = useCallback(() => {
    if (!currentApp) {
      return;
    }
    return updateApp({
      id: currentApp.id,
      status:
        currentApp.status === AppStatusType.Active
          ? AppStatusType.Inactive
          : AppStatusType.Active,
    });
  }, [currentApp, updateApp]);

  const updateAppName = useCallback(
    (name: string) => {
      if (!currentApp) {
        return;
      }
      return updateAppNameMutation.trigger({
        id: currentApp.id,
        name,
      });
    },
    [currentApp, updateAppNameMutation]
  );

  const updateAppDescription = useCallback(
    (description: string) => {
      if (!currentApp) {
        return;
      }
      return updateAppDescriptionMutation.trigger({
        id: currentApp.id,
        description_internal: description,
      });
    },
    [currentApp, updateAppDescriptionMutation]
  );

  const removeApp = useCallback(() => {
    if (!currentApp) {
      return;
    }
    return removeAppMutation.trigger({
      id: currentApp.id,
    });
  }, [currentApp, removeAppMutation]);

  const onInsertSuccess = useCallback(
    (data: AppModel) => {
      if (data) {
        setApps([data]);
        router.push(urls.app(data.id));
        toast.success("App created");
      }
    },
    [router, setApps]
  );

  const insertNewAppMutation = useSWRMutation("app", insertAppFetcher, {
    onSuccess: onInsertSuccess,
    onError: () => {
      toast.error("Failed to create new app");
    },
  });

  const createNewApp = useCallback(
    async (data: NewAppPayload) => {
      return await insertNewAppMutation.trigger(data);
    },
    [insertNewAppMutation]
  );

  return {
    apps: data,
    error,
    isLoading,
    currentApp,
    toggleAppActivity,
    isToggleAppActivityMutating: toggleAppActivityMutation.isMutating,
    updateAppName,
    isUpdateAppNameMutating: updateAppNameMutation.isMutating,
    updateAppDescription,
    isUpdateAppDescriptionMutating: updateAppDescriptionMutation.isMutating,
    createNewApp,
    removeApp,
    isRemoveAppMutating: removeAppMutation.isMutating,
  };
};

export default useApps;
