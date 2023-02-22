import {
  actions,
  afterMount,
  kea,
  path,
  reducers,
  listeners,
  selectors,
} from "kea";
import type { authLogicType } from "./authLogicType";
import { loaders } from "kea-loaders";
import { ContractType, UserType } from "types";
import { gql } from "@apollo/client";
import { decodeJwt } from "jose";
import { graphQLRequest, restAPIRequest } from "frontend-api";
import posthog from "posthog-js";
import { isSSR } from "common/helpers/is-ssr";
import getConfig from "next/config";
const { publicRuntimeConfig } = getConfig();

const FetchMeQuery = gql`
  query FetchMeQuery($id: String!) {
    user(where: { id: { _eq: $id } }) {
      id
      name
      email
      is_subscribed
      team_id
    }
  }
`;

interface UserWithTeamType extends UserType {
  team_id: string;
}
interface FetchMeQueryResponse {
  user: UserWithTeamType[];
}

export const authLogic = kea<authLogicType>([
  path(["logics", "authLogic"]),
  actions({
    setToken: (token: string | null) => ({ token }),
    loadToken: true,
    logout: true,
    initTelemetry: true,
  }),
  reducers({
    token: [
      null as null | string,
      {
        setToken: (_, { token }) => token,
      },
    ],
  }),
  listeners(({ actions }) => ({
    setToken: async ({ token }) => {
      if (isSSR()) {
        return;
      }

      if (token) {
        window.localStorage.setItem("token", token);
        actions.loadUser();
      } else {
        window.localStorage.removeItem("token");
      }
    },
    loadToken: async () => {
      if (!isSSR()) {
        actions.setToken(window.localStorage.getItem("token"));
      }
    },
    logout: async () => {
      if (isSSR()) {
        return;
      }

      actions.setToken(null);
      try {
        posthog.reset();
      } catch {}
      window.location.href = "/login"; // Perform a full reload to make sure the state is cleared
    },
    loadUserSuccess: async ({ user }) => {
      if (user) {
        // FIXME: Remove this console.log
        console.log("Identify user on PostHog");
        posthog.identify(user.id, { is_subscribed: user.is_subscribed });
      }
    },
    initTelemetry: async () => {
      if (isSSR()) {
        return;
      }

      const enabledOnDevEnvVar =
        publicRuntimeConfig.NEXT_PUBLIC_POSTHOG_ENABLE_ON_DEV;
      const apiKey = publicRuntimeConfig.NEXT_PUBLIC_POSTHOG_API_KEY;
      const shouldDisable =
        (!enabledOnDevEnvVar || enabledOnDevEnvVar === "0") &&
        process.env.NODE_ENV === "development";

      const persistence =
        window.localStorage.getItem("cookieBanner") === "rejected"
          ? "memory"
          : "localStorage+cookie";

      if (apiKey) {
        posthog.init(apiKey, {
          autocapture: true,
          debug: process.env.NODE_ENV === "development",
          persistence,
          loaded: (posthog) => {
            posthog.register({ env: process.env.NODE_ENV });
          },
        });
      }

      if (shouldDisable) {
        //posthog.opt_out_capturing();
      }
    },
  })),
  loaders(({ values, actions }) => ({
    user: [
      null as null | UserType,
      {
        loadUser: async () => {
          if (!values.token) {
            throw "Improperly called `loadUser`. `token` is not set.";
          }

          let decodedToken;

          try {
            decodedToken = decodeJwt(values.token);
          } catch (err) {
            actions.logout();
            console.warn(
              "User token is no longer valid. Redirecting to login."
            );
            return null;
          }

          const response = await graphQLRequest<FetchMeQueryResponse>({
            query: FetchMeQuery,
            variables: { id: decodedToken.sub },
          });

          if (!response.data) {
            return null;
          }

          return { ...response.data.user[0], team: undefined };
        },
      },
    ],
    contracts: [
      [] as Array<ContractType>,
      {
        loadContracts: async () => {
          try {
            return await restAPIRequest<Array<ContractType>>("/contracts");
          } catch (error) {
            console.error(error);
            return [];
          }
        },
      },
    ],
  })),
  selectors({
    isAuthenticated: [
      (s) => [s.token],
      (token: string): boolean => Boolean(token),
    ],
  }),
  afterMount(({ actions }) => {
    actions.loadToken();
    actions.loadContracts();
    actions.initTelemetry();
  }),
]);
