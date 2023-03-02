import { gql } from "@apollo/client";
import { graphQLRequest } from "src/lib/frontend-api";
import { kea, path, connect, actions } from "kea";
import { forms } from "kea-forms";
import { loaders } from "kea-loaders";
import { toast } from "react-toastify";
import { AppType } from "src/lib/types";
import type { appLogicType } from "./appLogicType";
import { appQueryParams, appsLogic } from "./appsLogic";

type LoadAppsInterface = {
  app: Array<AppType>;
  update_app_by_pk?: AppType;
  delete_app_by_pk: { id: string };
};

export type UpdateAppFormValues = {
  name: string;
};

// TODO allow updating app's logo
const updateAppQuery = (attr: string) => gql`
  mutation UpdateApp($app_id: String!, $value: String!) {
    update_app_by_pk(
      pk_columns: { id: $app_id }
      _set: { ${attr}: $value }
    ) {
        ${appQueryParams}
    }
  }
`;

export const appLogic = kea<appLogicType>([
  path(["logics", "appLogic"]),
  connect({
    values: [appsLogic, ["apps"]],
    actions: [appsLogic, ["replaceAppAtList"]],
  }),
  actions({
    loadApp: ({ app_id }: { app_id: string }) => ({ app_id }),
  }),
  loaders(({ values, actions }) => ({
    app: [
      null as AppType | null,
      {
        loadApp: async ({ app_id }, breakpoint) => {
          await breakpoint(100);
          if (!values.apps.length) {
            actions.loadApp({ app_id });
          }
          breakpoint();
          const app = values.apps.filter((app) => app.id === app_id)[0] || null;

          if (app) {
            //   actions.updateListFilter({ app_id: app.id });
            return app;
          }

          return null;
        },
        updateApp: async (
          {
            attr,
            value,
            skipToast,
          }: {
            attr: keyof AppType;
            value: string;
            skipToast?: boolean;
          },
          breakpoint
        ) => {
          if (!values.app?.id) return values.app;

          breakpoint();
          const response = await graphQLRequest<LoadAppsInterface>({
            query: updateAppQuery(attr),
            variables: {
              app_id: values.app.id,
              value,
            },
          });

          // Notify user of success
          if (!skipToast) {
            toast.success("App updated successfully!");
          }

          // Update app list so other views get updated too
          const app = response.data?.update_app_by_pk ?? null;

          if (app) {
            actions.replaceAppAtList(app);
          }

          return app;
        },
      },
    ],
  })),

  forms(({ actions }) => ({
    updateApp: {
      // @REVIEW Is it possible to add values.app.name do defaults? Gives an error.
      defaults: {
        name: "",
      } as UpdateAppFormValues,

      errors: ({ name }) => ({
        name: !name ? "Please enter a name for your app" : undefined,
      }),

      submit: async (payload, breakpoint) => {
        breakpoint();

        actions.updateApp({ attr: "name", value: payload.name });
        actions.resetUpdateApp({ name: "" });
      },
    },
  })),
]);
