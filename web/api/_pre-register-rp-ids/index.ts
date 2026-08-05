import { getSdk as getAppInfoSdk } from "@/api/hasura/register-rp/graphql/get-app-info.generated";
import { getSdk as getFetchRpSdk } from "@/api/helpers/graphql/fetch-rp-registration.generated";
import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import { getKMSClient } from "@/api/helpers/kms";
import { resolveManagerAddress } from "@/api/helpers/rp-manager";
import { submitRegisterRpTransaction } from "@/api/helpers/rp-transactions";
import {
  generateRpIdString,
  getRpRegistryConfig,
  isZeroAddress,
  parseRpId,
} from "@/api/helpers/rp-utils";
import { getRpFromContract } from "@/api/helpers/temporal-rpc";
import { protectInternalEndpoint } from "@/api/helpers/utils";
import { validateRequestSchema } from "@/api/helpers/validate-request-schema";
import { logger } from "@/lib/logger";
import { isAddress } from "ethers";
import { NextRequest, NextResponse } from "next/server";
import * as yup from "yup";

/**
 * Hard ceiling on how many apps one call may claim on-chain. Each claim is a
 * UserOp that costs L2 gas and pulls the registry's WLD fee from our Safe, so
 * an accidental "pre-register everything" must not be one request away. Drain a
 * larger backlog across repeated calls.
 */
const MAX_APPS_PER_CALL = 25;

const schema = yup
  .object({
    app_ids: yup
      .array()
      .of(yup.string().strict().required())
      .min(1)
      .max(MAX_APPS_PER_CALL)
      .required(),
    /**
     * Defaults to true: the only way to spend gas is to ask for it explicitly.
     * A dry run reports exactly what a real run would submit.
     */
    dry_run: yup.boolean().default(true),
  })
  .noUnknown();

type Outcome =
  | "would_claim"
  | "claimed"
  | "skipped_already_registered_in_portal"
  | "skipped_already_claimed_by_us"
  | "skipped_taken_by_foreign_manager"
  | "skipped_staging"
  | "skipped_app_not_found"
  | "failed_rpc"
  | "failed_submission";

/**
 * Defensively claim the on-chain rp_id of apps that have not migrated to World
 * ID 4.0 yet, so nobody else can.
 *
 * For every app created before unpredictable rp_ids, `rp_id` is
 * `uint64(keccak256(app_id))` over a *public* app_id, and on-chain `register()`
 * is permissionless, zero-fee and first-come. Those ids are public and
 * predictable forever, so salting new registrations cannot protect the existing
 * installed base — the only defense left is to hold the id ourselves until the
 * app is ready to use it (H1 #3910854).
 *
 * A claim registers the rp_id to the Portal's SHARED manager key with a
 * placeholder signer. Two consequences worth being explicit about:
 *
 *  - No `rp_registration` row is created. On-chain state is the record of what
 *    we hold, and `submitManagedRpRegistration` reads it to decide whether to
 *    adopt. Inventing rows would make the Portal claim apps are registered when
 *    their owners never asked, and `proof-context` serves off that row.
 *  - The signer is a placeholder that must never be able to sign. Nothing can
 *    verify against a claimed-but-unadopted rp_id, which is the intent.
 *
 * Adoption: when the app later registers in managed mode,
 * `submitManagedRpRegistration` sees our own manager on-chain and rotates the
 * signer instead of registering. SELF-MANAGED apps cannot adopt yet — the
 * developer would need the manager transferred to them
 * (`submitTransferManagerTransaction` exists but no flow drives it), so
 * `register_rp` fails them loudly with an actionable error rather than leaving
 * a row that polls forever. Do not claim ids for apps expected to self-manage
 * until that flow lands.
 */
export async function POST(request: NextRequest) {
  const { isAuthenticated, errorResponse } = protectInternalEndpoint(request);
  if (!isAuthenticated) {
    return errorResponse;
  }

  // Kill switch. Off means this endpoint cannot spend anything, whatever it is
  // called with.
  if (process.env.ENABLE_RP_ID_PRE_REGISTRATION !== "true") {
    logger.warn("RP id pre-registration is disabled");
    return NextResponse.json(
      { error: "RP id pre-registration is disabled." },
      { status: 503 },
    );
  }

  const body = await request.json().catch(() => null);
  const { isValid, parsedParams } = await validateRequestSchema({
    value: body,
    schema,
  });
  if (!isValid || !parsedParams) {
    return NextResponse.json(
      {
        error: `Invalid request body. Expected { app_ids: string[] (1..${MAX_APPS_PER_CALL}), dry_run?: boolean }.`,
      },
      { status: 400 },
    );
  }

  const { app_ids: appIds, dry_run: dryRun } = parsedParams;

  const config = getRpRegistryConfig();
  if (!config) {
    logger.error("RP Registry is not configured for pre-registration");
    return NextResponse.json(
      { error: "RP Registry is not configured." },
      { status: 500 },
    );
  }

  // Deliberately the shared key, not a dedicated per-RP key: a claim is not a
  // registration, and minting a KMS key per unmigrated app would be thousands
  // of keys we may never adopt. It is also what makes adoption decidable —
  // `submitManagedRpRegistration` compares the on-chain manager against this
  // one address.
  const managerKmsKeyId = process.env.RP_REGISTRY_MANAGER_KMS_KEY_ID;
  if (!managerKmsKeyId) {
    logger.error(
      "RP_REGISTRY_MANAGER_KMS_KEY_ID is required for pre-registration",
    );
    return NextResponse.json(
      { error: "Shared manager key is not configured." },
      { status: 500 },
    );
  }

  const placeholderSigner = process.env.RP_ID_PRE_REGISTRATION_SIGNER;
  if (
    !placeholderSigner ||
    !isAddress(placeholderSigner) ||
    isZeroAddress(placeholderSigner)
  ) {
    logger.error(
      "RP_ID_PRE_REGISTRATION_SIGNER must be a valid non-zero address",
    );
    return NextResponse.json(
      { error: "Placeholder signer is not configured." },
      { status: 500 },
    );
  }

  const managerAddress = await resolveManagerAddress(
    managerKmsKeyId,
    config.kmsRegion,
  );
  if (!managerAddress) {
    // Without our own manager address we cannot tell "already ours" from
    // "someone else's", and claiming blindly could overwrite nothing but would
    // report nonsense. Fail the run instead.
    logger.error("Could not resolve the shared manager address from KMS");
    return NextResponse.json(
      { error: "Could not resolve the manager address." },
      { status: 503 },
    );
  }

  const client = await getAPIServiceGraphqlClient();
  const results: { app_id: string; outcome: Outcome; rp_id?: string }[] = [];

  for (const appId of appIds) {
    const rpIdString = generateRpIdString(appId);
    const rpId = parseRpId(rpIdString);

    const { app } = await getAppInfoSdk(client).GetAppInfo({ app_id: appId });
    const appInfo = app?.[0];
    if (!appInfo) {
      results.push({ app_id: appId, outcome: "skipped_app_not_found" });
      continue;
    }
    if (appInfo.is_staging) {
      // Staging apps never migrate to World ID 4.0, so there is nothing to
      // protect and their rp_ids are not worth spending gas on.
      results.push({ app_id: appId, outcome: "skipped_staging" });
      continue;
    }

    // An app that already has a row owns its rp_id through the normal flow;
    // claiming on top of it would at best waste a submission and at worst
    // interfere with an in-flight registration.
    const { rp_registration } = await getFetchRpSdk(client).FetchRpRegistration(
      {
        app_id: appId,
      },
    );
    if (rp_registration?.length) {
      results.push({
        app_id: appId,
        outcome: "skipped_already_registered_in_portal",
        rp_id: rpIdString,
      });
      continue;
    }

    let onChain;
    try {
      onChain = await getRpFromContract(rpId, config.contractAddress);
    } catch (error) {
      // Never claim on a failed read: `register()` reverts with IdAlreadyInUse
      // if the id is taken, so a blind submission burns gas and, worse, a read
      // failure is indistinguishable from "free" here.
      logger.warn("Could not read on-chain RP state; skipping", {
        error,
        app_id: appId,
        rpIdString,
      });
      results.push({ app_id: appId, outcome: "failed_rpc", rp_id: rpIdString });
      continue;
    }

    if (onChain.initialized) {
      const isOurs =
        onChain.manager?.toLowerCase() === managerAddress.toLowerCase();
      if (!isOurs) {
        // Already squatted. Nothing this endpoint can do — the contract has no
        // reclaim path — but it is the single most important thing to surface.
        logger.error("rp_id is already held by a foreign manager", {
          app_id: appId,
          rpIdString,
          onChainManager: onChain.manager,
          onChainSigner: onChain.signer,
        });
      }
      results.push({
        app_id: appId,
        outcome: isOurs
          ? "skipped_already_claimed_by_us"
          : "skipped_taken_by_foreign_manager",
        rp_id: rpIdString,
      });
      continue;
    }

    if (dryRun) {
      results.push({
        app_id: appId,
        outcome: "would_claim",
        rp_id: rpIdString,
      });
      continue;
    }

    try {
      const kmsClient = await getKMSClient(config.kmsRegion);
      const operationHash = await submitRegisterRpTransaction(config, {
        rpId,
        managerAddress,
        signerAddress: placeholderSigner,
        appName: appInfo.app_metadata?.[0]?.name || "",
        kmsClient,
      });
      logger.info("Claimed rp_id defensively", {
        app_id: appId,
        rpIdString,
        operationHash,
      });
      results.push({ app_id: appId, outcome: "claimed", rp_id: rpIdString });
    } catch (error) {
      logger.error("Failed to claim rp_id", {
        error,
        app_id: appId,
        rpIdString,
      });
      results.push({
        app_id: appId,
        outcome: "failed_submission",
        rp_id: rpIdString,
      });
    }
  }

  const counts = results.reduce<Record<string, number>>((acc, r) => {
    acc[r.outcome] = (acc[r.outcome] ?? 0) + 1;
    return acc;
  }, {});

  // Log the breakdown rather than only the total: a run that skipped everything
  // for an unexpected reason must not read as a successful sweep.
  logger.info("RP id pre-registration run finished", {
    dry_run: dryRun,
    requested: appIds.length,
    counts,
  });

  return NextResponse.json({ dry_run: dryRun, counts, results });
}
