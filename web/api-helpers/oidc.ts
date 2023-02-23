import { gql } from "@apollo/client";
import { ActionModel, AppModel } from "models";
import { IInternalError } from "types";
import { getAPIServiceClient } from "./graphql";

const fetchAppQuery = gql`
  query FetchAppQuery($app_id: String!) {
    app(
      where: {
        id: { _eq: $app_id }
        status: { _eq: "active" }
        is_archived: { _eq: false }
        engine: { _eq: "cloud" }
      }
    ) {
      id
      is_staging
      actions(where: { action: { _eq: "" } }) {
        external_nullifier
      }
    }

    cache(
      where: {
        _or: [
          { key: { _eq: "semaphore.wld.eth" } }
          { key: { _eq: "staging.semaphore.wld.eth" } }
        ]
      }
    ) {
      key
      value
    }
  }
`;

// TODO: client_secret
interface OIDCApp {
  id: AppModel["id"];
  is_staging: AppModel["is_staging"];
  external_nullifier: ActionModel["external_nullifier"];
  contract_address: string;
}

type FetchOIDCAppResult = {
  app: Array<
    Pick<AppModel, "id" | "is_staging"> & {
      actions?: Array<Pick<ActionModel, "external_nullifier">>;
    }
  >;
  cache: Array<{ key: string; value: string }>;
};

export const fetchOIDCApp = async (
  app_id: string
): Promise<{ app?: OIDCApp; error?: IInternalError }> => {
  const client = await getAPIServiceClient();
  const { data } = await client.query<FetchOIDCAppResult>({
    query: fetchAppQuery,
    variables: { app_id },
  });

  if (data.app.length === 0) {
    return {
      error: {
        code: "not_found",
        message: "App not found or not active.",
        statusCode: 404,
        attribute: "app_id",
      },
    };
  }

  const app = data.app[0];
  if (!app.actions?.length) {
    return {
      error: {
        code: "sign_in_not_enabled",
        message: "App does not have Sign in with World ID enabled.",
        statusCode: 400,
        attribute: "app_id",
      },
    };
  }

  const external_nullifier = app.actions[0].external_nullifier;
  delete app.actions;

  const ensName = app.is_staging
    ? "staging.semaphore.wld.eth"
    : "semaphore.wld.eth";
  const contractRecord = data.cache.find(({ key }) => key === ensName);
  if (!contractRecord) {
    return {
      error: {
        message:
          "There was an internal issue verifying this proof. Please try again.",
        code: "contract_not_found",
        statusCode: 500,
      },
    };
  }

  return {
    app: {
      ...app,
      external_nullifier,
      contract_address: contractRecord.value,
    },
  };
};
