import { AppMetadataModel, AppModel } from "@/lib/models";
import { gql } from "@apollo/client";
import { useRouter } from "next/router";
import { useCallback } from "react";
import { toast } from "react-toastify";
import { graphQLRequest } from "src/lib/frontend-api";
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
      app_metadata(where: { status: { _neq: "verified" } }) {
        ${appMetadataFields}
      }
      verified_app_metadata: app_metadata(where: { status: { _eq: "verified" } }) {
        ${appMetadataFields}
      }
    }
  }
`;

const UpdateAppMetadataQuery = gql`
  mutation UpdateApp(
    $metadata_id: String = ""
    $name: String
    $logo_img_url: String = ""
    $showcase_img_urls: String[] = null
    $hero_image_url: String = ""
    $description: String = ""
    $world_app_description: String = ""
    $is_app_active: Boolean
    $category: String = ""
    $is_developer_allow_listing: Boolean
    $integration_url: String = ""
    $app_website_url: String = ""
    $source_code_url: String = ""
  ) {
    update_app_metadata_by_pk(
      pk_columns: { id: $metadata_id }
      _set: {
        name: $name
        logo_img_url: $logo_img_url
        showcase_img_urls: $showcase_img_urls
        hero_image_url: $hero_image_url
        description: $description
        world_app_description: $world_app_description
        is_app_active: $is_app_active
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
  mutation InsertApp($appObject: app_insert_input!) {
    insert_app_one(object: $appObject) {
      ${appFields}
    }
  }
`;

const InsertAppMetadataQuery = gql`
  mutation InsertAppMetadata($appMetadataObject: app_metadata_insert_input!) {
    insert_app_metadata_one(object:$appMetadataObject) {
      ${appMetadataFields}
    }
  }
`;

const DeleteAppQuery = gql`
  mutation DeleteApp($id: String!) {
    delete_app_by_pk(id: $id) {
      id
    }
  }
`;
const fetchApps = async (
  attemptedToHandleMissingMetadata: boolean = false
): Promise<Array<AppModel>> => {
  const response = await graphQLRequest<{
    app: Array<AppModel>;
  }>({
    query: FetchAppsQuery,
  });

  const apps = response.data?.app || [];
  // Even verified apps will have an unverified row. Thus the only case this will be true is if we have an orphaned app row
  const appsMissingMetadata = apps.filter((app) => !app.app_metadata);

  // Checks for orphaned app rows and tries to add a metadata row
  if (appsMissingMetadata.length > 0 && !attemptedToHandleMissingMetadata) {
    await handleMissingMetadata(appsMissingMetadata);
    return fetchApps(true);
  }

  return apps;
};

const handleMissingMetadata = async (appsMissingMetadata: Array<AppModel>) => {
  await Promise.all(
    appsMissingMetadata.map((app) =>
      _insertAppMetadata(app.id, {
        name: "Unnamed App " + app.id,
        description: "",
      }).catch((error) => {
        // Better to catch this here to prevent it from blocking. Can prompt user to try again on the front end
        console.error(`Failed to create metadata for app ${app.id}:`, error);
        return null;
      })
    )
  );
};

const updateAppMetadataFetcher = async (
  _key: string,
  args: {
    arg: {
      metadata_id: AppMetadataModel["id"];
      name?: AppMetadataModel["name"];
      logo_img_url?: AppMetadataModel["logo_img_url"];
      is_app_active?: AppMetadataModel["is_app_active"];
      showcase_img_urls?: AppMetadataModel["showcase_img_urls"];
      hero_image_url?: AppMetadataModel["hero_image_url"];
      description?: AppMetadataModel["description"];
      category?: AppMetadataModel["category"];
      integration_url?: AppMetadataModel["integration_url"];
      is_developer_allow_listing?: AppMetadataModel["is_developer_allow_listing"];
      world_app_description?: AppMetadataModel["world_app_description"];
      app_website_url?: AppMetadataModel["app_website_url"];
      source_code_url?: AppMetadataModel["source_code_url"];
    };
  }
) => {
  const currentApp = useAppStore.getState().currentApp;
  const {
    metadata_id,
    name,
    logo_img_url,
    showcase_img_urls,
    hero_image_url,
    description,
    category,
    integration_url,
    is_developer_allow_listing,
    world_app_description,
    is_app_active,
    app_website_url,
    source_code_url,
  } = args.arg;

  if (!currentApp) {
    throw new Error("No current app");
  }

  if (!currentApp.app_metadata) {
    throw new Error("No App Metadata Exists");
    // Need to go insert instead
  }

  const unverifiedAppMetadata = currentApp.app_metadata;
  if (unverifiedAppMetadata.status !== "unverified") {
    throw new Error("You can only update unverified app metadata");
  }

  const response = await graphQLRequest<{
    update_app_by_pk: AppMetadataModel;
  }>({
    query: UpdateAppMetadataQuery,
    variables: {
      metadata_id: metadata_id,
      name: name ?? unverifiedAppMetadata.name,
      logo_img_url: logo_img_url ?? unverifiedAppMetadata.logo_img_url,
      showcase_img_urls:
        showcase_img_urls ?? unverifiedAppMetadata.showcase_img_urls,
      hero_image_url: hero_image_url ?? unverifiedAppMetadata.hero_image_url,
      description: description ?? unverifiedAppMetadata.description,
      world_app_description:
        world_app_description ?? unverifiedAppMetadata.world_app_description,
      is_app_active: is_app_active ?? unverifiedAppMetadata.is_app_active,
      category: category ?? unverifiedAppMetadata.category,
      is_developer_allow_listing:
        is_developer_allow_listing ??
        unverifiedAppMetadata.is_developer_allow_listing,
      integration_url: integration_url ?? unverifiedAppMetadata.integration_url,
      app_website_url: app_website_url ?? unverifiedAppMetadata.app_website_url,
      source_code_url: source_code_url ?? unverifiedAppMetadata.source_code_url,
    },
  });
  // Update the particular app metadata item in the array
  if (response.data?.update_app_by_pk) {
    const updatedApp = {
      ...currentApp,
      app_metadata: response.data.update_app_by_pk,
    };
    return updatedApp;
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

type NewAppPayload = Pick<AppModel, "engine" | "is_staging"> & {
  app_metadata: NewAppMetadataPayload;
};
type NewAppMetadataPayload = Pick<AppMetadataModel, "name" | "description">;

const insertAppFetcher = async (_key: string, args: { arg: NewAppPayload }) => {
  const { engine, is_staging, app_metadata } = args.arg;
  if (!app_metadata) {
    throw new Error("No app metadata provided");
  }
  // First, insert the app and get the new ID
  const appResponse = await graphQLRequest<{
    insert_app_one: AppModel;
  }>({
    query: InsertAppQuery,
    variables: {
      appObject: {
        engine,
        is_staging,
      },
    },
  });

  const newAppId = appResponse.data?.insert_app_one.id;

  if (!newAppId) {
    throw new Error("Failed to insert new app");
  }
  const { name, description } = app_metadata;

  const appMetadataResponse = await _insertAppMetadata(newAppId, {
    name,
    description,
  });

  if (
    appMetadataResponse.data?.insert_app_metadata_one &&
    appResponse.data?.insert_app_one
  ) {
    const newApp = {
      ...appResponse.data?.insert_app_one,
      app_metadata: appMetadataResponse.data?.insert_app_metadata_one,
    };

    return newApp;
  }

  throw new Error("Failed to insert app metadata");
};

const _insertAppMetadata = async (
  newAppId: string,
  appMetadata: NewAppMetadataPayload
) => {
  const { name, description } = appMetadata;

  try {
    const response = await graphQLRequest<{
      insert_app_metadata_one: AppMetadataModel;
    }>({
      query: InsertAppMetadataQuery,
      variables: {
        appMetadataObject: {
          app_id: newAppId,
          name,
          description,
        },
      },
    });

    return response;
  } catch (error) {
    throw new Error("Failed to insert app metadata");
  }
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

  const { trigger: updateApp } = useSWRMutation(
    "app",
    updateAppMetadataFetcher,
    {
      onSuccess: (data) => {
        if (data) {
          setCurrentApp(data);
        }
      },
    }
  );

  const toggleAppActivityMutation = useSWRMutation(
    "app",
    updateAppMetadataFetcher,
    {
      onSuccess: (data) => {
        if (data) {
          setCurrentApp(data);
        }
      },
    }
  );

  const removeAppMutation = useSWRMutation("app", deleteAppFetcher, {
    onSuccess: async (data) => {
      if (data) {
        await router.replace("/app");
        toast.success("App deleted");
        setCurrentApp(null);
      }
    },
  });

  const updateAppMetadata = useCallback(
    async (appMetaData: Partial<AppMetadataModel>) => {
      const currentApp = useAppStore.getState().currentApp;

      if (!currentApp) {
        throw new Error("No current app to update");
      }
      // Should check that there's an unverified row to update. Otherwise we should insert a new row
      if (currentApp.app_metadata?.status !== "unverified") {
        throw new Error("No unverified app metadata to update");
      }
      const metadata_id = currentApp.app_metadata.id;
      if (!metadata_id) {
        throw new Error("No metadata ID provided");
      }
      return updateApp({
        ...appMetaData,
        metadata_id: metadata_id,
      });
    },
    [updateApp]
  );

  const toggleAppActivity = useCallback(() => {
    if (!currentApp) {
      return;
    }
    if (!currentApp.app_metadata.id) {
      throw new Error("No app metadata ID");
    }
    return updateApp({
      metadata_id: currentApp.app_metadata.id,
      is_app_active: !currentApp.app_metadata?.is_app_active,
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

  const parseDescription = (currentApp: AppMetadataModel | null) => {
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
    updateAppMetadata,
    createNewApp,
    removeApp,
    parseDescription,
    encodeDescription,
    isRemoveAppMutating: removeAppMutation.isMutating,
  };
};

export default useApps;
