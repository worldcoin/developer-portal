import {
  kea,
  path,
  actions,
  reducers,
  listeners,
  afterMount,
  connect,
  selectors,
} from "kea";
import type { AppType } from "src/lib/types";
import type { appsLogicType } from "./appsLogicType";
import { forms } from "kea-forms";
import { graphQLRequest } from "src/lib/frontend-api";
import { toast } from "react-toastify";
import Router from "next/router";
import { urls } from "src/lib/urls";
import { gql } from "@apollo/client";
import { loaders } from "kea-loaders";
import posthog from "posthog-js";
import { actionsLogic, ListFilter } from "./actionsLogic";

// TODO support adding a logo on app creation
export type CreateAppFormValues = {
  name: string;
  logoUrl?: string;
};

interface LoadAppsInterface {
  app: AppType[];
  insert_app_one?: AppType;
  delete_app_by_pk?: { id: string };
}

type FilterAppsProps = {
  apps: Array<AppType>;
  listFilter: ListFilter;
  listFilterApplied: boolean;
};

export const filterApps = ({
  apps,
  listFilter,
  listFilterApplied,
}: FilterAppsProps): Array<AppType> => {
  const searchQuery = listFilter.search_query?.toLowerCase() || "";

  const isDesiredAction = (action: AppType["actions"][0]) => {
    const satisfiesArchivedCondition =
      listFilter.show_archived || !action.is_archived;

    const satisfiesSearchCondition =
      action.name.toLowerCase().includes(searchQuery) ||
      action.description.toLowerCase().includes(searchQuery);

    const satisfiesStatusCondition =
      listFilter.status === "all" ||
      (listFilter.status === "staging" && action.is_staging) ||
      (listFilter.status === "production" && !action.is_staging);

    if (
      !satisfiesArchivedCondition ||
      !satisfiesSearchCondition ||
      !satisfiesStatusCondition
    ) {
      return false;
    }

    return true;
  };

  if (!listFilterApplied) {
    return apps.map((app) => ({
      ...app,
      actions: app.actions.filter((action) => !action.is_archived),
    }));
  }

  if (listFilter.app_id && !listFilterApplied) {
    return apps.filter((app) => listFilter.app_id === app.id);
  }

  if (listFilter.app_id && listFilterApplied) {
    const app = apps.find((app) => listFilter.app_id === app.id);

    if (!app) {
      return [];
    }

    return [
      {
        ...app,
        actions: app?.actions.filter((action) => isDesiredAction(action)),
      },
    ];
  }

  return apps
    .filter((app) => app.actions.some((action) => isDesiredAction(action)))
    .map((app) => ({
      ...app,
      actions: app.actions.filter((action) => isDesiredAction(action)),
    }));
};

export const appQueryParams = `
id
team_id
name
logo_url
is_verified
verified_app_logo
actions {
  id
  is_staging
  description
  engine
  created_at
  app_id
  is_archived
  max_verifications_per_person
  name
  public_description
  return_url
  smart_contract_address
  status
  updated_at
  user_interfaces
}`;

const AppQuery = gql`
  query Apps {
    app {
      ${appQueryParams}
    }
  }
`;

const insertAppQuery = gql`
  mutation InsertApp($name: String!) {
    insert_app_one(
      object: {name: $name}
    ) {
      ${appQueryParams}
    }
  }
`;

const deleteAppQuery = gql`
  mutation DeleteApp($app_id: String!) {
    delete_app_by_pk(id: $app_id) {
      id
    }
  }
`;

export const appsLogic = kea<appsLogicType>([
  path(["logics", "appsLogic"]),
  connect({
    values: [actionsLogic, ["listFilter", "listFilterApplied"]],
    actions: [actionsLogic, ["replaceActionAtList", "updateActionList"]],
  }),
  actions({
    loadApps: true,
    updateAppList: (apps: Array<AppType>) => ({ apps }),
    replaceAppAtList: (updatedApp: AppType) => ({ updatedApp }),
  }),
  listeners(({ actions, values }) => ({
    loadAppsSuccess: ({ apps }) => {
      if (apps.length) {
        posthog.group("team", apps[0].team_id, { apps_count: apps.length });
      }
    },

    replaceActionAtList: () => {
      actions.loadApps();
    },

    updateActionList: () => {
      actions.loadApps();
    },
  })),
  reducers({
    apps: [
      [] as Array<AppType>,
      {
        updateAppList: (_, { apps }) => apps,
        replaceAppAtList: (oldApps, { updatedApp }) => {
          return oldApps.map((oldApp) =>
            oldApp.id === updatedApp.id ? updatedApp : oldApp
          );
        },
      },
    ],
  }),
  selectors({
    filteredAppsList: [
      (s) => [s.apps, s.listFilter, s.listFilterApplied],
      (apps: Array<AppType>, listFilter, listFilterApplied): AppType[] => {
        return filterApps({ apps, listFilter, listFilterApplied });
      },
    ],
  }),
  loaders(({ values, actions }) => ({
    apps: [
      [],
      {
        loadApps: async () => {
          const response = await graphQLRequest<LoadAppsInterface>({
            query: AppQuery,
          });

          return response.data?.app || [];
        },
      },
    ],
    deletedApp: [
      null,
      {
        deleteApp: async ({ app_id }: { app_id: string }, breakpoint) => {
          breakpoint();
          const response = await graphQLRequest<LoadAppsInterface>({
            query: deleteAppQuery,
            variables: { app_id },
          });

          if (response.data?.delete_app_by_pk?.id === app_id) {
            toast.success("App deleted successfully.");
            actions.updateAppList(
              values.apps.filter(({ id }) => id !== app_id)
            );
            if (Router.pathname === urls.app()) {
              Router.push("/");
            }
          }

          return null;
        },
      },
    ],
  })),
  forms(({ actions, values }) => ({
    newApp: {
      defaults: { name: "" } as CreateAppFormValues,
      errors: ({ name }) => ({
        name: !name ? "Please enter a name for your app" : undefined,
      }),
      submit: async (payload, breakpoint) => {
        breakpoint();

        const response = await graphQLRequest<LoadAppsInterface>({
          query: insertAppQuery,
          variables: payload,
        });
        const app = response.data?.insert_app_one ?? null;

        if (app) {
          actions.resetNewApp();
          toast.success(`${app.name} app created successfully!`);
          actions.updateAppList([...values.apps, app]);
          Router.push(urls.app());
        }
      },
    },
  })),
  afterMount(({ actions }) => {
    actions.loadApps();
  }),
]);
