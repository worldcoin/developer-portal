import { gql } from "@apollo/client";
import { graphQLRequest } from "frontend-api";
import {
  actions,
  kea,
  listeners,
  path,
  reducers,
  selectors,
  afterMount,
} from "kea";
import { forms } from "kea-forms";
import { loaders } from "kea-loaders";
import Router from "next/router";
import { toast } from "react-toastify";
import { CreateActionFormValues } from "scenes/action/types";
import { ActionType, EnvironmentType } from "types";
import { urls } from "urls";
import { ENVIRONMENTS } from "utils";
import type { actionsLogicType } from "./actionsLogicType";
import { authLogic } from "./authLogic";

interface LoadActionsInterface {
  action: ActionType[];
  insert_action_one?: ActionType;
  delete_action_by_pk?: { id: string };
  update_action_by_pk?: ActionType;
}

export interface ListFilter {
  // Imported by actionsLogicType.ts
  app_id?: string | null;
  search_query?: string;
  status?: "all" | "staging" | "production";
  show_archived?: boolean;
}

export const actionQueryParams = (detailed?: boolean) => `
id
name
is_staging
is_archived
public_description
description
engine
created_at
updated_at
status
return_url
user_interfaces
smart_contract_address
app {
  id
  name
  logo_url
  verified_app_logo
  is_verified
}
${
  detailed
    ? `
nullifiers_aggregate {
  aggregate {
    count
  }
}`
    : ""
}
`;

const listActionsQuery = gql`
  query Actions {
    action {
      ${actionQueryParams()}
    }
  }
`;

const insertActionQuery = gql`
  mutation InsertAction($name: String!, $is_staging: Boolean!, $engine: String!, $description: String!, $app_id: String!) {
    insert_action_one(
      object: { name: $name, is_staging: $is_staging, engine: $engine, description: $description, app_id: $app_id }
    ) {
      ${actionQueryParams(true)}
    }
  }
`;

const deleteActionQuery = gql`
  mutation DeleteAction($action_id: String!) {
    delete_action_by_pk(id: $action_id) {
      id
      app_id
    }
  }
`;

export const archiveActionQuery = gql`
  mutation ArchiveAction($action_id: String!, $value: Boolean!) {
    update_action_by_pk(
      pk_columns: { id: $action_id }
      _set: { is_archived: $value }
    ) {
      ${actionQueryParams(true)}
    }
  }
`;

export const actionsLogic = kea<actionsLogicType>([
  path(["logics", "actionsLogic"]),
  actions({
    loadActions: true,
    updateListFilter: (
      payload: Partial<ListFilter>,
      merge: boolean = true
    ) => ({
      payload,
      merge,
    }),
    updateActionList: (payload: ActionType[]) => ({ payload }),
    replaceActionAtList: (updatedAction: ActionType) => ({ updatedAction }), // Updates a specific action on the action list
  }),
  reducers({
    actions: [
      [] as ActionType[],
      {
        updateActionList: (_, { payload }) => payload,
      },
    ],
    listFilter: [
      {
        app_id: null,
        search_query: "",
        status: "all",
        show_archived: false,
      } as ListFilter,
      {
        updateListFilter: (state, { payload, merge = true }) =>
          merge ? { ...state, ...payload } : payload,
      },
    ],
  }),
  loaders(({ values, actions }) => ({
    actions: [
      [] as ActionType[],
      {
        loadActions: async (_, breakpoint) => {
          // REVIEW this fixes load actions problem
          await breakpoint(100);
          if (!authLogic.isMounted()) {
            actions.loadActions();
            return [];
          }
          breakpoint();
          try {
            const response = await graphQLRequest<LoadActionsInterface>({
              query: listActionsQuery,
            });
            return response.data?.action as ActionType[];
          } catch (err) {
            console.log(err);
            return [];
          }
        },
      },
    ],
    deletedAction: [
      null,
      {
        deleteAction: async ({ action_id }: { action_id: string }) => {
          const response = await graphQLRequest<LoadActionsInterface>({
            query: deleteActionQuery,
            variables: { action_id },
          });

          if (response.data?.delete_action_by_pk?.id === action_id) {
            toast.success("Action deleted successfully.");

            actions.updateActionList(
              values.actions.filter((action) => action.id !== action_id)
            );

            if (Router.query.action_id) {
              Router.push(urls.actions());
            }
          }

          return null;
        },
      },
    ],
    archivedAction: [
      null,
      {
        archiveAction: async ({
          action_id,
          value,
        }: {
          action_id: string;
          value: boolean;
        }) => {
          const response = await graphQLRequest<LoadActionsInterface>({
            query: archiveActionQuery,
            variables: {
              action_id,
              value,
            },
          });

          const action = response.data?.update_action_by_pk;

          if (action?.id === action_id) {
            toast.success(
              `Action ${
                action.is_archived ? "archive" : "unarchive"
              } successfully.`
            );

            actions.replaceActionAtList(action);
          }

          return null;
        },
      },
    ],
  })),
  listeners(({ values, actions }) => ({
    replaceActionAtList: ({ updatedAction }) => {
      const actionList = [...values.actions];
      for (let i = 0; i < actionList.length; i++) {
        if (actionList[i].id === updatedAction?.id) {
          actionList[i] = updatedAction;
          break;
        }
      }
      actions.updateActionList(actionList);
    },
  })),
  // @ts-ignore FIXME bug with kea-typegen
  forms(({ actions, values }) => ({
    newAction: {
      defaults: { name: "", description: "" } as CreateActionFormValues,
      errors: ({ name, engine, environment, app_id }) => ({
        name: !name ? "Please enter a name for your action" : undefined,
        engine: !engine
          ? "Please select an engine before continuing"
          : undefined,
        environment: !environment
          ? "Please select an environment. Use staging for experiments and testing."
          : undefined,
        app_id: !app_id ? "Please select an app before continuing" : undefined,
      }),
      submit: async ({ environment, ...payload }, breakpoint) => {
        breakpoint();

        const response = await graphQLRequest<LoadActionsInterface>({
          query: insertActionQuery,
          variables: {
            ...payload,
            is_staging: environment === "staging" ? true : false,
          },
        });
        const action = response.data?.insert_action_one ?? null;

        if (action) {
          actions.resetNewAction();
          toast.success(`${action.name} action created successfully!`);
          actions.updateActionList([action, ...values.actions]);
          Router.push(urls.action(action.id));
        }
        return action;
      },
    },
  })),
  selectors({
    /** LIST ACTIONS */
    // List of actions with applied search and environment filters (to display in actions list)
    filteredActionList: [
      (s) => [s.actions, s.listFilter],
      (actions, listFilter): ActionType[] => {
        const searchQuery = listFilter.search_query?.toLowerCase() || "";

        return actions
          .filter(
            (action) =>
              !listFilter.app_id || action.app.id === listFilter.app_id
          )
          .filter(
            (action) =>
              action.name.toLowerCase().includes(searchQuery) ||
              action.description.toLowerCase().includes(searchQuery)
          )
          .filter(
            (action) =>
              listFilter.status === "all" ||
              (listFilter.status === "staging" && action.is_staging) ||
              (listFilter.status === "production" && !action.is_staging)
          )
          .filter((action) => listFilter.show_archived || !action.is_archived);
      },
    ],
    listFilterApplied: [
      (s) => [s.listFilter],
      (listFilter): boolean =>
        Boolean(
          listFilter.app_id ||
            listFilter.search_query ||
            listFilter.status !== "all" ||
            listFilter.show_archived
        ),
    ],
    /** SIDEBAR LIST */
    sidebarActionList: [
      (s) => [s.actions],
      (actions): ActionType[] => {
        return actions.filter((action) => !action.is_archived);
      },
    ],
    /** CREATE ACTION */
    newActionEnvironments: [
      (s) => [s.newAction],
      (newAction): EnvironmentType[] => {
        const environment = ENVIRONMENTS.find(
          ({ value }) => value === newAction.environment
        );

        if (environment) {
          return [
            environment,
            ...ENVIRONMENTS.filter(
              ({ value }) => value !== newAction.environment
            ),
          ];
        }
        return ENVIRONMENTS;
      },
    ],
  }),
  afterMount(({ actions }) => {
    actions.loadActions();
  }),
]);
