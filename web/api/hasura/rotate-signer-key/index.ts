import { getSdk as getCheckUserSdk } from "@/api/hasura/graphql/checkUserInApp.generated";
import { errorHasuraQuery } from "@/api/helpers/errors";
import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import {
  submitManagedSignerRotation,
  type ManagedRotationResult,
} from "@/api/helpers/rp-registration-flows";
import { normalizeAddress } from "@/api/helpers/rp-utils";
import { protectInternalEndpoint } from "@/api/helpers/utils";
import { validateRequestSchema } from "@/api/helpers/validate-request-schema";
import { isAddress } from "ethers";
import { NextRequest, NextResponse } from "next/server";
import * as yup from "yup";
import { getSdk as getRpRegistrationSdk } from "./graphql/get-rp-registration.generated";

const schema = yup
  .object({
    app_id: yup.string().strict().required(),
    new_signer_address: yup
      .string()
      .strict()
      .required()
      .transform((value) => (value ? normalizeAddress(value) : value))
      .test(
        "is-address",
        "Invalid signer key. Must be 40 hex characters (0x followed by 40 characters)",
        (value) => (value ? isAddress(value) : false),
      ),
  })
  .noUnknown();

const ROTATION_ERROR_HTTP_CODE: Record<
  Exclude<ManagedRotationResult, { ok: true }>["code"],
  string
> = {
  feature_not_enabled: "feature_not_enabled",
  config_error: "config_error",
  rp_not_registered: "rp_not_registered",
  self_managed_mode: "self_managed_mode",
  rotation_in_progress: "rotation_in_progress",
  submission_error: "submission_error",
  db_error: "db_error",
};

/**
 * POST handler for the rotate_signer_key Hasura action.
 *
 * Auth path: dashboard user with ADMIN/OWNER on the team. The KMS +
 * on-chain + DB-update pipeline lives in submitManagedSignerRotation so the
 * MCP path (api_key auth) can share it.
 */
export const POST = async (req: NextRequest) => {
  const { isAuthenticated, errorResponse } = protectInternalEndpoint(req);
  if (!isAuthenticated) {
    return errorResponse;
  }

  const body = await req.json();
  if (body?.action?.name !== "rotate_signer_key") {
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

  const { app_id, new_signer_address } = parsedParams;
  const client = await getAPIServiceGraphqlClient();

  // Resolve team_id up front so we can scope the permission check before
  // running the rotation flow (which also fetches the registration).
  const { rp_registration } = await getRpRegistrationSdk(
    client,
  ).GetRpRegistration({ app_id });
  if (!rp_registration || rp_registration.length === 0) {
    return errorHasuraQuery({
      req,
      detail: "RP registration not found for this app.",
      code: "rp_not_registered",
      app_id,
    });
  }
  const teamId = rp_registration[0].app.team_id;

  const { team } = await getCheckUserSdk(client).CheckUserInApp({
    team_id: teamId,
    app_id,
    user_id: userId,
  });
  if (!team || team.length === 0) {
    return errorHasuraQuery({
      req,
      detail: "User does not have permission to rotate signer key.",
      code: "unauthorized",
      app_id,
    });
  }

  const result = await submitManagedSignerRotation({
    client,
    appId: app_id,
    newSignerAddress: new_signer_address,
  });

  if (!result.ok) {
    return errorHasuraQuery({
      req,
      detail: result.detail,
      code: ROTATION_ERROR_HTTP_CODE[result.code],
      app_id,
    });
  }

  return NextResponse.json({
    rp_id: result.rpIdString,
    new_signer_address: result.newSignerAddress,
    old_signer_address: result.oldSignerAddress,
    status: result.status,
    operation_hash: result.operationHash,
  });
};
