/**
 * TEMPORARY endpoint to backfill drifted staging signers after RpRegistry
 * impl upgrade. Queries DB for all managed RPs, compares against on-chain
 * staging, and submits updateRp for any that differ.
 *
 * DELETE THIS FILE after the backfill is complete.
 *
 * Auth: Bearer API key for any valid app (just gates access).
 *
 * POST /api/backfill-staging-signers
 * Body: { "app_id": "app_xxx" }
 * Optional: { "app_id": "app_xxx", "limit": 25, "offset": 0, "dry_run": true }
 *
 * Call repeatedly with increasing offset until results come back empty.
 */

import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import { getKMSClient } from "@/api/helpers/kms";
import {
  getRpRegistryConfig,
  getStagingRpRegistryConfig,
  normalizeAddress,
  parseRpId,
} from "@/api/helpers/rp-utils";
import { submitRotateSignerTransaction } from "@/api/helpers/rp-transactions";
import { getRpFromContract } from "@/api/helpers/temporal-rpc";
import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { verifyApiKey } from "@/api/helpers/auth/verify-api-key";
import { getSdk as getUpdateStagingRetrySdk } from "../hasura/rp-retry/graphql/update-staging-retry.generated";

export const maxDuration = 300;

// Inline GraphQL — avoids generating types for a temporary endpoint
const FETCH_MANAGED_RPS_QUERY = `
  query FetchManagedRps($limit: Int!, $offset: Int!) {
    rp_registration(
      where: {
        mode: { _eq: "managed" },
        signer_address: { _is_null: false },
        manager_kms_key_id: { _is_null: false },
        status: { _eq: "registered" }
      },
      order_by: { rp_id: asc },
      limit: $limit,
      offset: $offset
    ) {
      rp_id
      signer_address
      manager_kms_key_id
    }
  }
`;

interface ManagedRp {
  rp_id: string;
  signer_address: string;
  manager_kms_key_id: string;
}

export const POST = async (req: NextRequest) => {
  const body = await req.json();
  const { app_id, limit = 25, offset = 0, dry_run = false } = body;

  if (!app_id) {
    return NextResponse.json(
      { error: "app_id is required for auth" },
      { status: 400 },
    );
  }

  const authResult = await verifyApiKey({ req, appId: app_id });
  if (!authResult.success) {
    return authResult.errorResponse;
  }

  // TEMPORARY: restrict to specific teams for the backfill
  const ALLOWED_TEAMS = [
    "team_0418559a90c2d1bed474cfd6c6308701",
    "team_49b143a1d031de615a0ecc42771ef52a",
  ];
  if (!ALLOWED_TEAMS.includes(authResult.teamId)) {
    return NextResponse.json({ error: "Unauthorized team" }, { status: 403 });
  }

  const primaryConfig = getRpRegistryConfig();
  const stagingConfig = getStagingRpRegistryConfig();

  if (!primaryConfig || !stagingConfig) {
    return NextResponse.json(
      { error: "RP registry or staging config not available" },
      { status: 500 },
    );
  }

  const client = await getAPIServiceGraphqlClient();

  // 1. Fetch managed RPs from DB
  const gqlResult = await client.request<{
    rp_registration: ManagedRp[];
  }>(FETCH_MANAGED_RPS_QUERY, {
    limit: Math.min(limit, 50),
    offset,
  });

  const managedRps = gqlResult?.rp_registration ?? [];

  if (managedRps.length === 0) {
    return NextResponse.json({
      summary: { total: 0, submitted: 0, in_sync: 0, skipped: 0, errors: 0 },
      results: [],
      pagination: { offset, limit, returned: 0, has_more: false },
    });
  }

  const kmsClient = await getKMSClient(primaryConfig.kmsRegion);

  const results: Array<{
    rp_id: string;
    status: "submitted" | "in_sync" | "skipped" | "error";
    operation_hash?: string;
    reason?: string;
  }> = [];

  for (const rp of managedRps) {
    try {
      const numericRpId = parseRpId(rp.rp_id);

      // 2. Read on-chain staging signer
      let onChainRp;
      try {
        onChainRp = await getRpFromContract(
          numericRpId,
          stagingConfig.contractAddress,
        );
      } catch {
        results.push({
          rp_id: rp.rp_id,
          status: "skipped",
          reason: "not_on_staging",
        });
        continue;
      }

      if (!onChainRp.initialized) {
        results.push({
          rp_id: rp.rp_id,
          status: "skipped",
          reason: "not_initialized",
        });
        continue;
      }

      // 3. Compare
      if (
        normalizeAddress(onChainRp.signer).toLowerCase() ===
        normalizeAddress(rp.signer_address).toLowerCase()
      ) {
        results.push({ rp_id: rp.rp_id, status: "in_sync" });
        continue;
      }

      if (dry_run) {
        results.push({
          rp_id: rp.rp_id,
          status: "submitted",
          reason: "dry_run",
        });
        continue;
      }

      // 4. Submit updateRp to staging
      const operationHash = await submitRotateSignerTransaction(stagingConfig, {
        rpId: numericRpId,
        newSignerAddress: rp.signer_address,
        managerKmsKeyId: rp.manager_kms_key_id,
        kmsClient,
      });

      try {
        await getUpdateStagingRetrySdk(client).UpdateStagingRetry({
          rp_id: rp.rp_id,
          staging_operation_hash: operationHash,
          staging_status: "pending",
        });
      } catch (dbError) {
        logger.warn("Backfill: failed to persist staging state", {
          rpId: rp.rp_id,
          error: dbError,
        });
      }

      logger.info("Backfill: staging signer submitted", {
        rpId: rp.rp_id,
        operationHash,
        targetSigner: rp.signer_address,
        onChainSigner: onChainRp.signer,
      });

      results.push({
        rp_id: rp.rp_id,
        status: "submitted",
        operation_hash: operationHash,
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : "unknown";
      logger.error("Backfill: failed", { rpId: rp.rp_id, error });
      results.push({ rp_id: rp.rp_id, status: "error", reason: msg });
    }
  }

  const summary = {
    total: results.length,
    submitted: results.filter((r) => r.status === "submitted").length,
    in_sync: results.filter((r) => r.status === "in_sync").length,
    skipped: results.filter((r) => r.status === "skipped").length,
    errors: results.filter((r) => r.status === "error").length,
  };

  logger.info("Backfill staging signers batch complete", {
    ...summary,
    offset,
    limit,
  });

  return NextResponse.json({
    summary,
    results,
    pagination: {
      offset,
      limit,
      returned: managedRps.length,
      has_more: managedRps.length === Math.min(limit, 50),
    },
  });
};
