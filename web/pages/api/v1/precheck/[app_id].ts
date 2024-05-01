import { runCors } from "@/legacy/backend/cors";
import { errorNotAllowed, errorResponse } from "@/legacy/backend/errors";
import { getAPIServiceClient } from "@/legacy/backend/graphql";
import {
  canVerifyForAction,
  validateRequestSchema,
} from "@/legacy/backend/utils";
import {
  ActionModel,
  AppMetadataModel,
  AppModel,
  NullifierModel,
} from "@/legacy/lib/models";
import { CanUserVerifyType, EngineType } from "@/legacy/lib/types";
import { generateExternalNullifier } from "@/lib/hashing";
import { getCDNImageUrl } from "@/lib/utils";
import { gql } from "@apollo/client";
import { NextApiRequest, NextApiResponse } from "next";
import * as yup from "yup";

type _Nullifier = Pick<
  NullifierModel,
  "nullifier_hash" | "uses" | "__typename"
>;

type AppMetadataPayload = Pick<AppMetadataModel, "name" | "logo_img_url">;

interface _Action
  extends Pick<
    ActionModel,
    | "name"
    | "description"
    | "max_verifications"
    | "max_accounts_per_user"
    | "action"
    | "external_nullifier"
    | "status"
    | "__typename"
  > {
  nullifiers: [_Nullifier] | [];
}

interface _App
  extends Pick<AppModel, "__typename" | "id" | "engine" | "is_staging"> {
  is_verified: boolean;
  actions: _Action[];
  name: string;
  verified_app_logo: string;
}

interface _AppQueryReturnInterface
  extends Pick<AppModel, "__typename" | "id" | "engine" | "is_staging"> {
  verified_app_metadata: AppMetadataPayload[];
  app_metadata: AppMetadataPayload[];
  actions: _Action[];
}

interface AppPrecheckQueryInterface {
  app: _AppQueryReturnInterface[];
}

const appPrecheckQuery = gql`
  query AppPrecheckQuery(
    $app_id: String!
    $external_nullifier: String
    $nullifier_hash: String
  ) {
    app(
      where: {
        id: { _eq: $app_id }
        status: { _eq: "active" }
        is_archived: { _eq: false }
      }
    ) {
      id
      is_staging
      engine
      app_metadata(where: { verification_status: { _neq: "verified" } }) {
        name
      }
      verified_app_metadata: app_metadata(
        where: { verification_status: { _eq: "verified" } }
      ) {
        name
        logo_img_url
      }
      actions(where: { external_nullifier: { _eq: $external_nullifier } }) {
        external_nullifier
        name
        action
        description
        max_verifications
        max_accounts_per_user
        status
        privacy_policy_uri
        terms_uri
        nullifiers(where: { nullifier_hash: { _eq: $nullifier_hash } }) {
          uses
          nullifier_hash
        }
      }
    }
  }
`;

const schema = yup.object().shape({
  action: yup
    .string()
    .strict()
    .required("This attribute is required")
    .default(""),

  nullifier_hash: yup
    .string()
    .nullable()
    .default("")
    .transform((value) => (value === null ? "" : value)),

  external_nullifier: yup
    .string()
    .strict()
    .nullable()
    .when("action", {
      is: (action: unknown) => action === null,
      then: (s) =>
        s.required("This attribute is required when action is not provided."),
    }),
});

/**
 * Fetches public metadata for an app & action.
 * Can be used to check whether a user can verify for a particular action.
 * Called by the World App before rendering proof request modals.
 * Called by the kiosk.
 * This endpoint is publicly available.
 * @param req
 * @param res
 */
export default async function handlePrecheck(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  await runCors(req, res);
  if (!req.method || !["POST", "OPTIONS"].includes(req.method)) {
    return errorNotAllowed(req.method, res, req);
  }

  const { isValid, parsedParams, handleError } = await validateRequestSchema({
    schema,
    value: req.body,
  });

  if (!isValid) {
    return handleError(req, res);
  }

  const app_id = req.query.app_id as `app_${string}`;
  const action = parsedParams.action ?? "";
  const nullifier_hash = parsedParams.nullifier_hash;
  const external_nullifier =
    parsedParams.external_nullifier ??
    generateExternalNullifier(app_id, action).digest;

  const client = await getAPIServiceClient();

  // ANCHOR: Fetch app from Hasura
  const appQueryResult = await client.query<AppPrecheckQueryInterface>({
    query: appPrecheckQuery,

    variables: {
      app_id,
      nullifier_hash,
      external_nullifier,
    },
  });

  const rawAppValues = appQueryResult.data.app?.[0];

  if (!rawAppValues) {
    return errorResponse(
      res,
      404,
      "not_found",
      "We couldn't find an app with this ID. Action may be inactive.",
      null,
      req,
    );
  }
  const app_metadata = rawAppValues.app_metadata[0];
  const verified_app_metadata = rawAppValues.verified_app_metadata[0];
  // If a image is present it should store it's relative path and extension ie logo.png
  const logo_img_url = verified_app_metadata?.logo_img_url
    ? getCDNImageUrl(rawAppValues.id, verified_app_metadata?.logo_img_url)
    : "";
  // Prevent breaking changes
  const app: _App = {
    __typename: rawAppValues.__typename,
    id: rawAppValues.id,
    engine: rawAppValues.engine,
    is_staging: rawAppValues.is_staging,
    is_verified: verified_app_metadata ? true : false,
    name: verified_app_metadata?.name ?? app_metadata?.name ?? "",
    verified_app_logo: logo_img_url,
    actions: rawAppValues.actions,
  };

  // ANCHOR: If the action doesn't exist return error
  if (!app.actions.length) {
    return errorResponse(
      res,
      400,
      "required",
      "This attribute is required for new actions.",
      "action",
      req,
    );
  }

  const actionItem = app.actions[0];

  if (actionItem.status === "inactive") {
    return errorResponse(
      res,
      400,
      "action_inactive",
      "This action is inactive.",
      "status",
      req,
    );
  }

  const nullifier = actionItem.nullifiers?.[0];

  const response = {
    ...app,
    actions: undefined,
    sign_in_with_world_id: action === "", // DEPRECATED: will be removed in v2
    is_sign_in: action === "",
    action: { ...actionItem, nullifiers: undefined },
    ...(nullifier
      ? {
          nullifier: {
            uses: nullifier?.uses,
          },
        }
      : {}),
    can_user_verify: CanUserVerifyType.Undetermined, // Provides mobile app information on whether to allow the user to verify. By default we cannot determine if the user can verify unless conditions are met.
  };

  if (app.engine === EngineType.OnChain) {
    // On-chain actions uniqueness cannot be verified in the Developer Portal
    response.can_user_verify = CanUserVerifyType.OnChain;
  } else {
    if (response.sign_in_with_world_id) {
      // User can always verify for sign in with World ID
      response.can_user_verify = CanUserVerifyType.Yes;
    }

    // ANCHOR: If a nullifier hash is provided, determine if the user can verify
    if (nullifier_hash && response.action) {
      response.can_user_verify = canVerifyForAction(
        nullifier,
        response.action.max_verifications,
      )
        ? CanUserVerifyType.Yes
        : CanUserVerifyType.No;
    }
  }

  res.status(200).json(response);
}
