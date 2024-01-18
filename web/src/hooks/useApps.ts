import { AppMetadataModel, AppModel } from "@/lib/models";
import { AppStatusType } from "@/lib/types";
import { urls } from "@/lib/urls";
import { gql } from "@apollo/client";
import { useRouter } from "next/router";
import { useCallback } from "react";
import { toast } from "react-toastify";
import { graphQLRequest } from "src/lib/frontend-api";
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
id
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
verification_status
`;

const FetchAppsQuery = gql`
  query Apps {
    app(order_by: { created_at: asc }) {
      ${appFields}
      app_metadata(where: { verification_status: { _neq: "verified" } }) {
        ${appMetadataFields}
      }
      verified_app_metadata: app_metadata(where: { verification_status: { _eq: "verified" } }) {
        ${appMetadataFields}
      }
    }
  }
`;

const UpdateAppStatusQuery = gql`
  mutation UpdateAppStatus(
    $id: String = ""
    $status: String = ""
    ){
      update_app_by_pk(
        pk_columns: { id: $id }
        _set: {
          status: $status
        }
      ) {
        ${appFields}
      }
  }
`;

const UpsertAppMetadataQuery = gql`
  mutation UpsertAppMetadata(
    $app_id: String!
    $name: String
    $logo_img_url: String = ""
    $showcase_img_urls: _text = null
    $hero_image_url: String = ""
    $description: String = ""
    $world_app_description: String = ""
    $category: String = ""
    $is_developer_allow_listing: Boolean
    $integration_url: String = ""
    $app_website_url: String = ""
    $source_code_url: String = ""
  ) {
    insert_app_metadata_one(
      object: {
        app_id: $app_id
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
      on_conflict: {
        constraint: app_metadata_app_id_is_row_verified_key
        update_columns: [
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
        ]
        where: {
          verification_status: { _neq: "verified" }
        }
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
const fetchApps = async ([_key, team_id]: [
  string,
  string | undefined
]): Promise<Array<AppModel>> => {
  const response = await graphQLRequest<{
    app: Array<AppModel>;
  }>(
    {
      query: FetchAppsQuery,
    },
    undefined,
    {
      team_id: team_id ?? "",
    }
  );

  const unformattedApps = response.data?.app || [];

  const apps = unformattedApps.map(_parseAppModel);
  return apps;
};

const _parseAppModel = (appModel: AppModel): AppModel => {
  return {
    ...appModel,
    app_metadata: Array.isArray(appModel.app_metadata)
      ? appModel.app_metadata[0]
      : undefined,
    verified_app_metadata: Array.isArray(appModel.verified_app_metadata)
      ? appModel.verified_app_metadata[0]
      : undefined,
  };
};

const updateAppStatusFetcher = async (
  [_key, team_id]: [string, string | undefined],
  args: {
    arg: {
      id: AppModel["id"];
      status: AppModel["status"];
    };
  }
) => {
  const { id, status } = args.arg;
  const response = await graphQLRequest<{
    update_app_by_pk: AppModel;
  }>(
    {
      query: UpdateAppStatusQuery,
      variables: {
        id: id,
        status: status,
      },
    },
    undefined,
    {
      team_id: team_id ?? "",
    }
  );
  if (response.data?.update_app_by_pk) {
    return response.data.update_app_by_pk;
  }

  throw new Error("Failed to update app status");
};

const updateAppMetadataFetcher = async (
  [_key, team_id]: [string, string | undefined],
  args: {
    arg: {
      id: AppModel["id"];
      name?: AppMetadataModel["name"];
      logo_img_url?: AppMetadataModel["logo_img_url"];
      showcase_img_urls_unformatted?: AppMetadataModel["showcase_img_urls"];
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
    id,
    name,
    logo_img_url,
    showcase_img_urls_unformatted,
    hero_image_url,
    description,
    category,
    integration_url,
    is_developer_allow_listing,
    world_app_description,
    app_website_url,
    source_code_url,
  } = args.arg;

  if (!currentApp) {
    throw new Error("No current app");
  }

  const showcase_img_urls = showcase_img_urls_unformatted
    ? `{${showcase_img_urls_unformatted
        .map((url: string) => `"${url}"`)
        .join(",")}}`
    : undefined;
  const unverifiedAppMetadata = currentApp.app_metadata;

  // Upsert in the event no metadata row exists.
  const response = await graphQLRequest<{
    insert_app_metadata_one: AppMetadataModel;
  }>(
    {
      query: UpsertAppMetadataQuery,
      variables: {
        app_id: id,
        name: name ?? unverifiedAppMetadata?.name,
        logo_img_url: logo_img_url ?? unverifiedAppMetadata?.logo_img_url,
        showcase_img_urls:
          showcase_img_urls ?? unverifiedAppMetadata?.showcase_img_urls,
        hero_image_url: hero_image_url ?? unverifiedAppMetadata?.hero_image_url,
        description: description ?? unverifiedAppMetadata?.description,
        world_app_description:
          world_app_description ?? unverifiedAppMetadata?.world_app_description,
        category: category ?? unverifiedAppMetadata?.category,
        is_developer_allow_listing:
          is_developer_allow_listing ??
          unverifiedAppMetadata?.is_developer_allow_listing,
        integration_url:
          integration_url ?? unverifiedAppMetadata?.integration_url,
        app_website_url:
          app_website_url ?? unverifiedAppMetadata?.app_website_url,
        source_code_url:
          source_code_url ?? unverifiedAppMetadata?.source_code_url,
      },
    },
    undefined,
    {
      team_id: team_id ?? "",
    }
  );
  // Update the particular app metadata item in the array
  if (response.data?.insert_app_metadata_one) {
    const updatedApp = {
      ...currentApp,
      app_metadata: response.data.insert_app_metadata_one,
    };
    return updatedApp;
  }
  throw new Error("Failed to update app metadata");
};

const deleteAppFetcher = async (
  [_key, team_id]: [string, string | undefined],
  args: {
    arg: {
      id: AppModel["id"];
    };
  }
) => {
  const { id } = args.arg;

  const response = await graphQLRequest<{
    delete_app_by_pk: string;
  }>(
    {
      query: DeleteAppQuery,
      variables: { id },
    },
    undefined,
    { team_id: team_id ?? "" }
  );

  if (response.data?.delete_app_by_pk) {
    return response.data?.delete_app_by_pk;
  }

  toast.error("Failed to delete app");
};

type NewAppPayload = Pick<AppModel, "engine" | "is_staging"> & {
  app_metadata: NewAppMetadataPayload;
};
type NewAppMetadataPayload = Pick<AppMetadataModel, "name" | "description">;

const insertAppFetcher = async (
  [_key, team_id]: [string, string | undefined],
  args: { arg: NewAppPayload }
) => {
  const { engine, is_staging, app_metadata } = args.arg;
  if (!app_metadata) {
    throw new Error("No app metadata provided");
  }
  const appResponse = await graphQLRequest<{
    insert_app_one: AppModel;
  }>(
    {
      context: { headers: { team_id: team_id ?? "" } },
      query: InsertAppQuery,
      variables: {
        appObject: {
          engine,
          is_staging,
          name: app_metadata.name,
        },
      },
    },
    undefined,
    { team_id: team_id ?? "" }
  );
  const newAppId = appResponse.data?.insert_app_one.id;
  if (!newAppId) {
    throw new Error("Failed to insert new app");
  }
  const { name, description } = app_metadata;
  const appMetadataResponse = await _insertAppMetadata(
    newAppId,
    {
      name,
      description,
    },
    team_id
  );

  if (
    appMetadataResponse.data?.insert_app_metadata_one &&
    appResponse.data?.insert_app_one
  ) {
    const newApp = {
      ...appResponse.data?.insert_app_one,
      app_metadata: appMetadataResponse.data?.insert_app_metadata_one,
      verified_app_metadata: undefined,
    };
    return newApp;
  }

  throw new Error("Failed to insert app metadata");
};

const _insertAppMetadata = async (
  newAppId: string,
  appMetadata: NewAppMetadataPayload,
  team_id: string | undefined
) => {
  const { name, description } = appMetadata;

  try {
    const response = await graphQLRequest<{
      insert_app_metadata_one: AppMetadataModel;
    }>(
      {
        query: InsertAppMetadataQuery,
        variables: {
          appMetadataObject: {
            app_id: newAppId,
            name,
            description,
          },
        },
      },
      undefined,
      {
        team_id: team_id ?? "",
      }
    );

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
  const team_id = router.query.team_id as string | undefined;

  const { data, error, isLoading } = useSWR<Array<AppModel>>(
    ["app", team_id],
    fetchApps,
    {
      onSuccess: (data) => {
        if (data.length) {
          setApps(data);
        }
      },
    }
  );

  const { trigger: updateApp } = useSWRMutation(
    ["updateAppMetadata", team_id],
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
    ["toggleAppActivity", team_id],
    updateAppStatusFetcher,
    {
      onSuccess: (data) => {
        if (data) {
          setCurrentApp(data);
        }
      },
    }
  );

  const removeAppMutation = useSWRMutation(
    ["deletaAppFetcher", team_id],
    deleteAppFetcher,
    {
      onSuccess: async (data) => {
        if (data) {
          await router.replace(urls.app({ team_id: team_id ?? "" }));
          toast.success("App deleted");
          setCurrentApp(null);
        }
      },
    }
  );

  const updateAppMetadata = useCallback(
    async (appMetaData: Partial<AppMetadataModel>) => {
      const currentApp = useAppStore.getState().currentApp;

      if (!currentApp) {
        throw new Error("No current app to update");
      }

      return updateApp({
        ...appMetaData,
        id: currentApp.id,
      });
    },
    [updateApp]
  );

  const toggleAppActivity = useCallback(() => {
    if (!currentApp) {
      return;
    }
    return toggleAppActivityMutation.trigger({
      id: currentApp.id,
      status:
        currentApp.status === AppStatusType.Active
          ? AppStatusType.Inactive
          : AppStatusType.Active,
    });
  }, [currentApp, toggleAppActivityMutation]);

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
        router.push(urls.app({ app_id: data.id, team_id: team_id ?? "" }));
        toast.success("App created");
      }
    },
    [router, setApps, team_id]
  );

  const insertNewAppMutation = useSWRMutation(
    ["insertAppFetcher", team_id],
    insertAppFetcher,
    {
      onSuccess: onInsertSuccess,
      onError: () => {
        toast.error("Failed to create new app");
      },
    }
  );

  const createNewApp = useCallback(
    async (data: NewAppPayload) => {
      let result: any | null = null;

      try {
        result = await insertNewAppMutation.trigger(data);
      } catch (error) {
        console.log(error);
      }

      return result;
    },
    [insertNewAppMutation]
  );

  const parseDescription = (currentApp: AppMetadataModel | undefined) => {
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
