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
verified_app_logo
name
is_verified
engine
is_staging
status
description_internal
category
link_to_integration
is_developer_allow_listing
world_app_description
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
    $category: String = ""
    $link_to_integration: String = ""
    $is_developer_allow_listing: Boolean
    $world_app_description: String = ""
  ) {
    update_app_by_pk(
      pk_columns: { id: $id }
      _set: {
        status: $status
        name: $name
        description_internal: $description_internal
        link_to_integration: $link_to_integration
        category: $category
        is_developer_allow_listing: $is_developer_allow_listing
        world_app_description: $world_app_description
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

const descriptionSubFields = [
  "description_overview",
  "description_how_it_works",
  "description_connect",
];

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
      category?: AppModel["category"];
      link_to_integration?: AppModel["link_to_integration"];
      is_developer_allow_listing?: AppModel["is_developer_allow_listing"];
      world_app_description?: AppModel["world_app_description"];
    };
  }
) => {
  const currentApp = useAppStore.getState().currentApp;
  const {
    id,
    name,
    status,
    description_internal,
    category,
    link_to_integration,
    is_developer_allow_listing,
    world_app_description,
  } = args.arg;

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
      category: category ?? currentApp.category,
      link_to_integration: link_to_integration ?? currentApp.link_to_integration,
      is_developer_allow_listing:
        is_developer_allow_listing ?? currentApp.is_developer_allow_listing,
      world_app_description:
        world_app_description ?? currentApp.world_app_description,
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
      }
    },
  });

  const toggleAppActivityMutation = useSWRMutation("app", updateAppFetcher, {
    onSuccess: (data) => {
      if (data) {
        setCurrentApp(data);
      }
    },
  });

  const removeAppMutation = useSWRMutation("app", deleteAppFetcher, {
    onSuccess: async (data) => {
      if (data) {
        await router.replace("/app");
        toast.success("App deleted");
        setCurrentApp(null);
      }
    },
  });

  const updateAppData = useCallback(
    async (appData: Partial<AppModel>) => {
      const currentApp = useAppStore.getState().currentApp;

      if (!currentApp) {
        throw new Error("No current app to update");
      }

      return updateApp({
        id: currentApp.id,
        ...appData,
      });
    },
    [updateApp]
  );

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

  const parseDescription = (currentApp: AppModel | null) => {
    if (currentApp && currentApp.description_internal) {
      try {
        return JSON.parse(currentApp.description_internal);
      } catch (error) {
        console.error("Failed to parse description_internal:", error);
        return {
          description_overview: currentApp.description_internal,
          description_how_it_works: "",
          description_connect: "",
        };
      }
    }
    return {};
  };

  const encodeDescription = (
    description_overview: string,
    description_how_it_works: string = "",
    description_connect: string = ""
  ) => {
    return JSON.stringify({
      [descriptionSubFields[0]]: description_overview,
      [descriptionSubFields[1]]: description_how_it_works,
      [descriptionSubFields[2]]: description_connect,
    });
  };

  return {
    apps: data,
    error,
    isLoading,
    currentApp,
    toggleAppActivity,
    isToggleAppActivityMutating: toggleAppActivityMutation.isMutating,
    updateAppData,
    createNewApp,
    removeApp,
    parseDescription,
    encodeDescription,
    isRemoveAppMutating: removeAppMutation.isMutating,
  };
};

export default useApps;
