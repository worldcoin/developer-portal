import { getSdk as getCheckUserSdk } from "@/api/hasura/graphql/checkUserInApp.generated";
import { errorHasuraQuery } from "@/api/helpers/errors";
import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import {
  retryRpRegistration,
  type RpRetryEnvironment,
} from "@/api/helpers/rp-retry";
import { isValidRpId } from "@/api/helpers/rp-utils";
import { protectInternalEndpoint } from "@/api/helpers/utils";
import { validateRequestSchema } from "@/api/helpers/validate-request-schema";
import { NextRequest, NextResponse } from "next/server";
import * as yup from "yup";
import { getSdk as getGetRpRegistrationSdk } from "./graphql/get-rp-registration.generated";

const schema = yup
  .object({
    rp_id: yup.string().strict().required(),
    environment: yup.string().oneOf(["production", "staging"]).required(),
  })
  .noUnknown();

export const POST = async (req: NextRequest) => {
  const { isAuthenticated, errorResponse } = protectInternalEndpoint(req);
  if (!isAuthenticated) {
    return errorResponse;
  }

  const body = await req.json();
  if (body?.action?.name !== "retry_rp") {
    return errorHasuraQuery({
      req,
      detail: "Invalid action.",
      code: "invalid_action",
    });
  }

  const userId = body.session_variables["x-hasura-user-id"];
  if (!userId) {
    return errorHasuraQuery({
      req,
      detail: "userId must be set.",
      code: "required",
    });
  }

  const { isValid, parsedParams } = await validateRequestSchema({
    value: body.input,
    schema,
  });

  if (!isValid || !parsedParams) {
    return errorHasuraQuery({
      req,
      detail: "Invalid request body.",
      code: "invalid_request",
    });
  }

  const rpId = parsedParams.rp_id;
  const environment = parsedParams.environment as RpRetryEnvironment;

  if (!isValidRpId(rpId)) {
    return errorHasuraQuery({
      req,
      detail: "Invalid rp_id format. Must start with 'rp_'.",
      code: "invalid_rp_id",
    });
  }

  const client = await getAPIServiceGraphqlClient();
  const { rp_registration_by_pk: dbRecord } = await getGetRpRegistrationSdk(
    client,
  ).GetRpRegistrationForRetry({ rp_id: rpId });

  if (!dbRecord) {
    return errorHasuraQuery({
      req,
      detail: "RP registration not found.",
      code: "not_found",
    });
  }

  const appId = dbRecord.app_id;
  const teamId = dbRecord.app?.team_id;

  if (!teamId) {
    return errorHasuraQuery({
      req,
      detail: "RP registration is missing team context.",
      code: "invalid_request",
      app_id: appId,
    });
  }

  const { team } = await getCheckUserSdk(client).CheckUserInApp({
    team_id: teamId,
    app_id: appId,
    user_id: userId,
  });

  if (!team || team.length === 0) {
    return errorHasuraQuery({
      req,
      detail: "User does not have permission to retry RP registration.",
      code: "unauthorized",
      app_id: appId,
      team_id: teamId,
    });
  }

  const result = await retryRpRegistration({
    client,
    registration: dbRecord,
    environment,
  });
  if (!result.ok) {
    return errorHasuraQuery({
      req,
      detail: result.detail,
      code: result.code,
      app_id: appId,
      team_id: teamId,
    });
  }
  return NextResponse.json({
    success: true,
    environment: result.environment,
    operation_hash: result.operationHash,
  });
};
