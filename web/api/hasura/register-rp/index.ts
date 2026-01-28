import { getSdk as getCheckUserSdk } from "@/api/hasura/graphql/checkUserInApp.generated";
import { errorHasuraQuery } from "@/api/helpers/errors";
import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import { getKMSClient, scheduleKeyDeletion } from "@/api/helpers/kms";
import { createManagerKey, signEthDigestWithKms } from "@/api/helpers/kms-eth";
import {
  generateRpIdString,
  getRpRegistryConfig,
  normalizeAddress,
  parseRpId,
  RpRegistrationStatus,
  WORLD_CHAIN_ID,
} from "@/api/helpers/rp-utils";
import { sendUserOperation } from "@/api/helpers/temporal-rpc";
import {
  buildRegisterRpCalldata,
  buildUserOperation,
  encodeSafeUserOpCalldata,
  getRegisterRpNonce,
  getTxExpiration,
  hashSafeUserOp,
  replacePlaceholderWithSignature,
} from "@/api/helpers/user-operation";
import { protectInternalEndpoint } from "@/api/helpers/utils";
import { validateRequestSchema } from "@/api/helpers/validate-request-schema";
import { isWorldId40EnabledForTeam } from "@/lib/feature-flags";
import { logger } from "@/lib/logger";
import { getBytes, isAddress } from "ethers";
import { NextRequest, NextResponse } from "next/server";
import * as yup from "yup";
import { getSdk as getClaimRpSdk } from "./graphql/claim-rp-registration.generated";
import { getSdk as getDeleteRpSdk } from "./graphql/delete-rp-registration.generated";
import { getSdk as getAppInfoSdk } from "./graphql/get-app-info.generated";
import { getSdk as getUpdateRpSdk } from "./graphql/update-rp-registration.generated";

/**
 * Input schema for the register_rp action.
 */
const schema = yup
  .object({
    app_id: yup.string().strict().required(),
    signer_address: yup
      .string()
      .strict()
      .required()
      .transform((value) => (value ? normalizeAddress(value) : value))
      .test("is-address", "Invalid Ethereum address", (value) =>
        value ? isAddress(value) : false,
      ),
  })
  .noUnknown();

/**
 * POST handler for the register_rp Hasura action.
 *
 * This endpoint:
 * 1. Validates the user owns the app
 * 2. Claims the registration slot (prevents concurrent registrations)
 * 3. Creates a KMS manager key for the RP
 * 4. Builds and signs a UserOperation to register the RP
 * 5. Submits to the temporal bundler
 * 6. Updates the registration with KMS key ID and tx hash
 */
export const POST = async (req: NextRequest) => {
  const { isAuthenticated, errorResponse } = protectInternalEndpoint(req);
  if (!isAuthenticated) {
    return errorResponse;
  }

  const body = await req.json();
  if (body?.action?.name !== "register_rp") {
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

  const { app_id, signer_address } = parsedParams;

  const config = getRpRegistryConfig();
  if (!config) {
    return errorHasuraQuery({
      req,
      detail: "Missing required environment variables for RP Registry.",
      code: "config_error",
    });
  }

  const client = await getAPIServiceGraphqlClient();

  const { app } = await getAppInfoSdk(client).GetAppInfo({ app_id });
  if (!app || app.length === 0) {
    return errorHasuraQuery({
      req,
      detail: "App not found.",
      code: "app_not_found",
      app_id,
    });
  }

  const appInfo = app[0];
  const teamId = appInfo.team_id;

  // Check if team is enabled for World ID 4.0
  const isEnabledForTeam = await isWorldId40EnabledForTeam(teamId);
  if (!isEnabledForTeam) {
    return errorHasuraQuery({
      req,
      detail: "World ID 4.0 is not enabled for this team.",
      code: "feature_not_enabled",
      app_id,
    });
  }

  // Verify user has permission (ADMIN or OWNER)
  const { team } = await getCheckUserSdk(client).CheckUserInApp({
    team_id: teamId,
    app_id,
    user_id: userId,
  });

  if (!team || team.length === 0) {
    return errorHasuraQuery({
      req,
      detail: "User does not have permission to register this app.",
      code: "unauthorized",
      app_id,
    });
  }

  const rpIdString = generateRpIdString(app_id);

  // STEP 1: Claim the registration slot
  // This prevents race conditions by using the database's unique constraint
  // on_conflict with empty update_columns means: if exists, return null
  const { insert_rp_registration_one: claimedSlot } = await getClaimRpSdk(
    client,
  ).ClaimRpRegistration({
    rp_id: rpIdString,
    app_id,
    mode: "managed",
    signer_address,
  });

  // Another registration already exists for this app
  if (!claimedSlot) {
    return errorHasuraQuery({
      req,
      detail: "Registration already in progress or completed for this app.",
      code: "already_registered",
      app_id,
    });
  }

  const rpId = parseRpId(rpIdString);

  // STEP 2: Create KMS manager key
  const kmsClient = await getKMSClient(config.kmsRegion);
  const managerKeyResult = await createManagerKey(kmsClient, rpIdString);

  if (!managerKeyResult) {
    await getDeleteRpSdk(client).DeleteRpRegistration({ rp_id: rpIdString });
    return errorHasuraQuery({
      req,
      detail: "Failed to create manager key.",
      code: "kms_error",
      app_id,
    });
  }

  const { keyId: managerKmsKeyId, address: managerAddress } = managerKeyResult;

  // Get the domain (app name)
  const appName = appInfo.app_metadata?.[0]?.name || "";

  // STEP 3: Build and sign UserOperation
  const innerCalldata = buildRegisterRpCalldata(
    rpId,
    managerAddress,
    signer_address,
    appName,
  );

  // Wrap in Safe's executeUserOp
  const safeCalldata = encodeSafeUserOpCalldata(
    config.contractAddress,
    0n,
    innerCalldata,
  );

  const nonce = getRegisterRpNonce(rpId);
  const { validAfter, validUntil } = getTxExpiration();

  const userOp = buildUserOperation(
    config.safeAddress,
    safeCalldata,
    nonce,
    validAfter,
    validUntil,
  );

  // Compute Safe Operation hash (EIP-712 typed data) - this is what the Safe owner signs
  const safeOpHash = hashSafeUserOp(
    userOp,
    WORLD_CHAIN_ID,
    config.safe4337ModuleAddress,
    config.entryPointAddress,
  );

  const signature = await signEthDigestWithKms(
    kmsClient,
    config.safeOwnerKmsKeyId,
    getBytes(safeOpHash),
  );

  if (!signature) {
    await scheduleKeyDeletion(kmsClient, managerKmsKeyId);
    await getDeleteRpSdk(client).DeleteRpRegistration({ rp_id: rpIdString });
    return errorHasuraQuery({
      req,
      detail: "Failed to sign transaction.",
      code: "signing_error",
      app_id,
    });
  }

  // Replace placeholder signature with actual signature (preserving validity timestamps)
  userOp.signature = replacePlaceholderWithSignature({
    placeholderSig: userOp.signature,
    signature: signature.serialized,
  });

  // STEP 4: Submit to temporal bundler
  let operationHash: string;
  try {
    const result = await sendUserOperation(userOp, config.entryPointAddress);
    operationHash = result.operationHash;
  } catch (error) {
    logger.error("Failed to submit registration transaction", {
      error,
      app_id,
    });
    await scheduleKeyDeletion(kmsClient, managerKmsKeyId);
    await getDeleteRpSdk(client).DeleteRpRegistration({ rp_id: rpIdString });
    return errorHasuraQuery({
      req,
      detail: "Failed to submit registration transaction.",
      code: "submission_error",
      app_id,
    });
  }

  // STEP 5: Update the registration with KMS key ID and operation hash
  const { update_rp_registration_by_pk: updatedRegistration } =
    await getUpdateRpSdk(client).UpdateRpRegistration({
      rp_id: rpIdString,
      manager_kms_key_id: managerKmsKeyId,
      operation_hash: operationHash,
    });

  if (!updatedRegistration) {
    // On-chain tx may succeed; manual intervention needed to reconcile state
    return errorHasuraQuery({
      req,
      detail: "Failed to update registration record.",
      code: "db_error",
      app_id,
    });
  }

  logger.info("RP registration successful", {
    app_id,
    rpIdString,
    managerAddress,
    operationHash,
  });

  return NextResponse.json({
    rp_id: rpIdString,
    manager_address: managerAddress,
    signer_address,
    status: RpRegistrationStatus.Pending,
    operation_hash: operationHash,
  });
};
