import { gql } from "@apollo/client";
import { graphQLRequest } from "src/lib/frontend-api";
import { AppModel } from "@/lib/models";
import useSWR from "swr";
import useSWRMutation from "swr/mutation";
import { IAppStore, useAppStore } from "src/stores/appStore";
import { shallow } from "zustand/shallow";
import { useCallback } from "react";
import { AppStatusType } from "src/lib/types";
import { toast } from "react-toastify";

const FetchAppsQuery = gql`
  query Apps {
    app(order_by: { created_at: asc }) {
      id
      logo_url
      name
      is_verified
      engine
      is_staging
      status
      description_internal
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
      id
      logo_url
      name
      is_verified
      engine
      is_staging
      status
      description_internal
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

const getStore = (store: IAppStore) => ({
  currentApp: store.currentApp,
  setApps: store.setApps,
  setCurrentApp: store.setCurrentApp,
});

const useApps = () => {
  const { currentApp, setApps, setCurrentApp } = useAppStore(getStore, shallow);

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

  const toggleAppActivity = useCallback(() => {
    if (!currentApp) {
      return;
    }

    updateApp({
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

      return updateApp({
        id: currentApp.id,
        name,
      });
    },
    [currentApp, updateApp]
  );

  const updateAppDescription = useCallback(
    (description: string) => {
      if (!currentApp) {
        return;
      }

      return updateApp({
        id: currentApp.id,
        description_internal: description,
      });
    },
    [currentApp, updateApp]
  );

  return {
    apps: data,
    error,
    isLoading,
    toggleAppActivity,
    updateAppName,
    updateAppDescription,
  };
};

export default useApps;
