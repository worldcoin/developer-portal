import { AppMetadataModel, AppModel } from "@/lib/models";
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

enum DescriptionSubFields {
  DescriptionOverview = "description_overview",
  DescriptionHowItWorks = "description_how_it_works",
  DescriptionConnect = "description_connect",
}

const appFields = `
id
engine
is_staging
status
`;

const appMetadataFields = `
app_id
name
logo_img_url
showcase_img_urls
hero_image_url
description
world_app_description
category
is_developer_allow_listing
integration_url
app_website_url
source_code_url
verified_at
review_message
status
`;

const FetchAppsQuery = gql`
  query Apps {
    app(order_by: { created_at: asc }) {
      ${appFields}
      app_metadata {
        ${appMetadataFields}
      }
    }
  }
`;

const UpdateAppQuery = gql`
  mutation UpdateApp(
    $id: String = ""
    $metadata_id: String = ""
    $name: String
    $logo_img_url: String = ""
    $showcase_img_urls: String[] = null
    $hero_image_url: String = ""
    $description: String = ""
    $world_app_description: String = ""
    $category: String = ""
    $is_developer_allow_listing: Boolean
    $integration_url: String = ""
    $app_website_url: String = ""
    $source_code_url: String = ""
    $status: String
  ) {
    update_app_by_pk(
      pk_columns: { id: $id }
      _set: {
        status: $status
      }
    ) {
      ${appFields}
    }
    update_app_metadata_by_pk(
      pk_columns: { id: $metadata_id }
      _set: {
        name: $name
        logo_img_url: $logo_img_url
        showcase_img_urls: $showcase_img_urls
        hero_image_url: $hero_image_url
        description: $description
        world_app_description: $world_app_description
        category: $category
        is_developer_allow_listing: $is_developer_allow_listing
        integration_url: $integration_url
        app_website_url: $app_website_url
        source_code_url: $source_code_url
      }
    ) {
      ${appMetadataFields}
    }
  }
`;

const InsertAppQuery = gql`
  mutation InsertApp($appObject: app_insert_input!, $appMetadataObject: app_metadata_insert_input!) {
    insert_app_one(object: $appObject) {
      ${appFields}
    }
    insert_app_metadata_one(object: $appMetadataObject) {
      ${appMetadataFields}
    }
  }
`;

const DeleteAppQuery = gql`
  mutation DeleteApp($id: String!) {
    delete_appmetadata(where: { app_id: { _eq: $id } }) {
      affected_rows
    }
    delete_app_by_pk(id: $id) {
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
      status?: AppModel["status"];
      app_metadata_id?: AppMetadataModel["id"];
      name?: AppMetadataModel["name"];
      description?: AppMetadataModel["description"];
      category?: AppMetadataModel["category"];
      integration_url?: AppMetadataModel["integration_url"];
      is_developer_allow_listing?: AppMetadataModel["is_developer_allow_listing"];
      world_app_description?: AppMetadataModel["world_app_description"];
    };
  }
) => {
  const currentApp = useAppStore.getState().currentApp;
  const {
    id,
    name,
    status,
    description,
    category,
    integration_url,
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
      description: description ?? currentApp.description,
      category: category ?? currentApp.category,
      integration_url: integration_url ?? currentApp.integration_url,
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
  "name" | "description" | "engine" | "is_staging"
>;

const insertAppFetcher = async (_key: string, args: { arg: NewAppPayload }) => {
  const { name, description, engine, is_staging } = args.arg;

  const response = await graphQLRequest<{
    insert_app_one: AppModel;
  }>({
    query: InsertAppQuery,
    variables: {
      object: {
        name,
        description,
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
    if (currentApp && currentApp.description) {
      try {
        return JSON.parse(currentApp.description);
      } catch (error) {
        console.error("Failed to parse description:", error);
        return {
          description_overview: currentApp.description,
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
      [DescriptionSubFields.DescriptionOverview]: description_overview,
      [DescriptionSubFields.DescriptionHowItWorks]: description_how_it_works,
      [DescriptionSubFields.DescriptionConnect]: description_connect,
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
