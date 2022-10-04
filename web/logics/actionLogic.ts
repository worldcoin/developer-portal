import { gql } from "@apollo/client";
import { Tab } from "common/Tabs/types";
import dayjs from "dayjs";
import { graphQLRequest } from "frontend-api";
import {
  actions,
  connect,
  kea,
  listeners,
  path,
  reducers,
  selectors,
} from "kea";
import { forms } from "kea-forms";
import { loaders } from "kea-loaders";
import { toast } from "react-toastify";
import { ProgressStep } from "scenes/action/types/progress-step";
import {
  ActionStatsModel,
  ActionType,
  UserInterfacesType,
  ActionUserInterfaces,
} from "types";
import { urls } from "urls";
import { validateUrl } from "utils";
import { actionQueryParams, actionsLogic } from "./actionsLogic";
import type { actionLogicType } from "./actionLogicType";
import { isSSR } from "common/helpers/is-ssr";

interface LoadActionsInterface {
  action: ActionType[];
  update_action_by_pk?: ActionType;
}

export interface VerifiedHumansInterface {
  get_action_stats: ActionStatsModel;
}

export interface StatsArgs {
  startsAt: string;
  timespan: "day" | "week" | "month" | "year";
}

export interface ActionUrlsInterface {
  // Imported by actionsLogicType.ts
  kiosk: string;
  hostedPage: string;
}

const retrieveActionQuery = gql`
  query Action($action_id: String!) {
    action(where: { id: { _eq: $action_id } }, limit: 1) {
        ${actionQueryParams(true)}
    }
  }
`;

const updateActionQuery = (attr: string) => gql`
  mutation UpdateAction($action_id: String!, $value: String!) {
    update_action_by_pk(
      pk_columns: { id: $action_id }
      _set: { ${attr}: $value }
    ) {
      ${actionQueryParams(true)}
    }
  }
`;

const updateUserInterfacesQuery = gql`
  mutation UpdateActionUserInterfaces($action_id: String!, $value: jsonb!) {
    update_action_by_pk(
      pk_columns: { id: $action_id }
      _set: { user_interfaces: $value }
    ) {
      ${actionQueryParams(true)}
    }
  }
`;

const getStatsQuery = gql`
  query GetStats(
    $action_id: String!
    $startsAt: timestamptz!
    $timespan: String!
  ) {
    get_action_stats(
      args: { actionId: $action_id, startsAt: $startsAt, timespan: $timespan }
    ) {
      action_id
      date
      total
      total_cumulative
    }
  }
`;

export const actionLogic = kea<actionLogicType>([
  path(["logics", "actionLogic"]),
  connect({
    actions: [actionsLogic, ["replaceActionAtList", "archiveActionSuccess"]],
  }),
  actions({
    enableUserInterface: (userInterface: UserInterfacesType) => ({
      userInterface,
    }),
    disableUserInterface: (userInterface: UserInterfacesType) => ({
      userInterface,
    }),
    activateActionIfReady: (action: ActionType) => ({ action }),
    setStatsArgs: (args: Partial<StatsArgs>, merge?: boolean) => ({
      args,
      merge,
    }),
    setCurrentAction: (action: ActionType) => ({ action }),
  }),
  reducers({
    currentAction: [
      null as ActionType | null,
      {
        setCurrentAction: (_, { action }) => action,
      },
    ],
    currentActionId: [
      // ID for the current action being viewed (/actions/{id} scene)
      null as string | null,
      {
        loadAction: (_, { id }) => id,
      },
    ],
    statsArgs: [
      {
        startsAt: dayjs().startOf("year").toISOString(),
        timespan: "day",
      } as StatsArgs,
      {
        setStatsArgs: (state, { args, merge }) =>
          merge ? { ...state, ...args } : (args as StatsArgs),
      },
    ],
  }),
  loaders(({ values, actions }) => ({
    // Current action being displayed on /actions/${id} scene
    currentAction: [
      null as ActionType | null,
      {
        loadAction: async ({ id }: { id: string }, breakpoint) => {
          // Reloads a specific action to make sure we're showing & updating the latest version
          // FIXME: Skip reloading if actions were just loaded (i.e. if you navigated directly to /actions/{id})
          breakpoint();
          const response = await graphQLRequest<LoadActionsInterface>({
            query: retrieveActionQuery,
            variables: {
              action_id: id,
            },
          });
          actions.loadStats({ action_id: id });
          return response.data?.action[0] ?? null;
        },
        updateAction: async (
          {
            attr,
            value,
            skipToast,
            skipActivation,
          }: {
            attr: keyof ActionType;
            value: string | ActionUserInterfaces;
            skipToast?: boolean;
            skipActivation?: boolean;
          },
          breakpoint
        ) => {
          breakpoint();
          const response = await graphQLRequest<LoadActionsInterface>({
            query:
              attr === "user_interfaces"
                ? updateUserInterfacesQuery
                : updateActionQuery(attr),
            variables: {
              action_id: values.currentActionId,
              value,
            },
          });

          // Notify user of success
          if (!skipToast) {
            toast.success("Action updated successfully!");
          }

          // Update actions list so other views get updated too
          const action = response.data?.update_action_by_pk ?? null;
          if (action) {
            actions.replaceActionAtList(action);
          }

          if (!skipActivation && action) {
            // Now that the action is updated, check if it should be activated
            actions.activateActionIfReady(action);
          }

          return action;
        },
      },
    ],
    currentActionStats: [
      null as ActionStatsModel | null,
      {
        loadStats: async ({ action_id }: { action_id: string }) => {
          const response = await graphQLRequest<VerifiedHumansInterface>({
            query: getStatsQuery,
            variables: {
              action_id,
              ...values.statsArgs,
            },
          });

          if (
            !response.data?.get_action_stats ||
            response.data.get_action_stats.length === 0
          ) {
            return null;
          }

          return response.data.get_action_stats as ActionStatsModel;
        },
      },
    ],
  })),
  listeners(({ values, actions }) => ({
    activateActionIfReady: async ({ action }, breakpoint) => {
      if (action.status !== "created") {
        return;
      }

      breakpoint();

      // FIXME For widget, we need to check the API request
      if (
        action.user_interfaces.enabled_interfaces?.length &&
        action.public_description
      ) {
        actions.updateAction({
          attr: "status",
          value: "active",
          skipActivation: true,
          skipToast: true,
        });
      }
    },
    enableUserInterface: async ({ userInterface }) => {
      if (!values.currentAction) {
        return;
      }
      actions.updateAction({
        attr: "user_interfaces",
        value: {
          ...values.currentAction.user_interfaces,
          enabled_interfaces: [
            ...new Set([
              ...(values.currentAction.user_interfaces.enabled_interfaces ??
                []),
              userInterface,
            ]),
          ],
        },
      });
    },
    disableUserInterface: async ({ userInterface }) => {
      if (!values.currentAction) {
        return;
      }
      actions.updateAction({
        attr: "user_interfaces",
        value: {
          ...values.currentAction.user_interfaces,
          enabled_interfaces: [
            ...new Set(
              (
                values.currentAction.user_interfaces.enabled_interfaces ?? []
              ).filter(
                (enabledInterface: unknown) =>
                  enabledInterface !== userInterface
              )
            ),
          ],
        },
      });
    },
    setStatsArgs: async () => {
      actions.loadStats({ action_id: values.currentActionId || "" });
    },
    loadActionSuccess: async ({ currentAction }) => {
      actions.setHostedPageConfigValue("return_url", currentAction?.return_url);
    },
    updateActionSuccess: async ({ currentAction }) => {
      actions.setHostedPageConfigValue("return_url", currentAction?.return_url);
    },
    archiveActionSuccess: async ({ payload }) => {
      if (
        values.currentAction &&
        values.currentAction.id === payload?.action_id
      ) {
        actions.loadAction({ id: payload.action_id });
      }
    },
  })),
  // @ts-ignore FIXME bug with kea-typegen
  forms(({ actions, values }) => ({
    hostedPageConfig: {
      defaults: { return_url: "" } as {
        return_url: string;
      },
      errors: ({ return_url }) => ({
        return_url: !return_url
          ? "Please enter a return URL"
          : !validateUrl(return_url, !values.currentAction?.is_staging)
          ? `Please enter a valid URL${
              !values.currentAction?.is_staging && " over https://"
            }`
          : undefined,
      }),
      submit: async ({ return_url }, breakpoint) => {
        breakpoint();
        actions.updateAction({ attr: "return_url", value: return_url });
      },
    },
    contractsConfig: {
      defaults: { smart_contract_address: "" },
      errors: ({ smart_contract_address }) => ({
        // FIXME: improve validation
        smart_contract_address:
          smart_contract_address &&
          !/^0x[\da-f]{28,}$/i.test(smart_contract_address)
            ? "Please enter a valid smart contract address"
            : undefined,
      }),
      submit: async ({ smart_contract_address }, breakpoint) => {
        breakpoint();
        actions.updateAction({
          attr: "smart_contract_address",
          value: smart_contract_address,
        });
      },
    },
  })),
  selectors({
    actionUrls: [
      (s) => [s.currentAction],
      (currentAction): ActionUrlsInterface | null => {
        if (isSSR() || !currentAction) {
          return null;
        }
        const url = new URL(window.location.href);
        url.pathname = urls.kiosk(currentAction.id);
        const kiosk = `${url.toString()}`;

        url.pathname = urls.hostedPage(currentAction.id);
        return { kiosk, hostedPage: `${url.toString()}?signal={yourSignal}` };
      },
    ],
    deploymentSteps: [
      (s) => [s.currentAction],
      (currentAction): Partial<Record<UserInterfacesType, string>> | null => {
        if (!currentAction) {
          return null;
        }
        return {
          kiosk: currentAction.user_interfaces.enabled_interfaces?.includes(
            "kiosk"
          )
            ? "access"
            : "overview",
        };
      },
    ],
    actionTabs: [
      (s) => [s.currentAction],
      (currentAction): Array<Tab> => {
        const baseTabs: Array<Tab> = [
          {
            name: "deployment",
            label: "Deployment",
            notifications: currentAction?.user_interfaces.enabled_interfaces
              ?.length
              ? 0
              : 1,
          },
          {
            name: "display",
            label: "Display",
            notifications: currentAction?.public_description ? 0 : 1,
          },
        ];

        return currentAction?.engine !== "on-chain"
          ? [...baseTabs, { name: "stats", label: "Stats", notifications: 0 }]
          : [...baseTabs];
      },
    ],
    hostedPageSteps: [
      (s) => [s.currentAction],
      (currentAction): { steps: ProgressStep[]; currentStep: ProgressStep } => {
        const hostedPageEnabled = Boolean(
          currentAction?.user_interfaces.enabled_interfaces?.includes(
            "hosted_page"
          )
        );
        const steps: ProgressStep[] = [
          { name: "Select user interface", value: "select", finished: true },
          {
            name: "Configure your hosted page",
            value: "configure",
            finished: Boolean(currentAction?.return_url),
          },
          {
            name: "Integrate hosted page",
            value: "integrate",
            finished: hostedPageEnabled,
          },
          {
            name: "Integration is live!",
            value: "live",
            finished: hostedPageEnabled,
          },
        ];
        let currentStep = steps[1];
        if (hostedPageEnabled) {
          currentStep = steps[3];
        } else if (currentAction?.return_url) {
          currentStep = steps[2];
        }
        return {
          currentStep,
          steps,
        };
      },
    ],
    apiWidgetSteps: [
      (s) => [s.currentAction],
      (currentAction): ProgressStep[] => {
        return [
          {
            name: "Select user interface",
            value: "select",
            finished: true,
          },
          {
            name: "Integrate JS widget & API",
            value: "integrate",
            finished:
              currentAction?.user_interfaces.enabled_interfaces?.includes(
                "widget"
              ) ?? false, // FIXME
          },
          // FIXME: When integration testing is supported
          //{ name: "Test your integration", value: "test", finished: false },
          {
            name: "Integration is live!",
            value: "live",
            finished:
              currentAction?.user_interfaces.enabled_interfaces?.includes(
                "widget"
              ) ?? false,
          },
        ];
      },
    ],
    chainUrlAddress: [
      (s) => [s.currentAction],
      (currentAction): string | undefined => {
        // FIXME implement other chains
        switch (currentAction?.crypto_chain) {
          case "polygon":
            return currentAction.is_staging
              ? `${process.env.NEXT_PUBLIC_CHAIN_URL_POLYGONSCAN_STAGING}${currentAction.smart_contract_address}`
              : `${process.env.NEXT_PUBLIC_CHAIN_URL_POLYGONSCAN_PRODUCTION}${currentAction.smart_contract_address}`;
          default:
            return undefined;
        }
      },
    ],
  }),
]);
