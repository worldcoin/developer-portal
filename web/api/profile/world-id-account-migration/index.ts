import { errorResponse, errorUnauthenticated } from "@/api/helpers/errors";
import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import { normalizeNullifierHash, verifyProof } from "@/api/helpers/verify";
import { auth0, toSessionRequest } from "@/lib/auth0";
import { WORLD_ID_MIGRATION_APP_IDS } from "@/lib/constants";
import { generateExternalNullifier } from "@/lib/hashing";
import { LegacyVerificationLevel } from "@/lib/idkit";
import { isWorldUser } from "@/lib/is-world-user";
import { logger } from "@/lib/logger";
import { appIdRegex } from "@/lib/schema";
import { Auth0SessionUser } from "@/lib/types";
import { NextRequest, NextResponse } from "next/server";
import { getSdk as getFetchUserByWorldIdNullifierSdk } from "./graphql/fetch-user-by-world-id-nullifier.generated";
import { getSdk as getMergeWorldIdAccountsSdk } from "./graphql/merge-world-id-accounts.generated";

// Sign in With World action defaults to ""
const ACTION = "";

// World ID 3.0 Proof type
type ProofV3 = {
  proof: string;
  merkle_root: string;
  nullifier: string;
  signal_hash: string;
  verification_level: LegacyVerificationLevel;
};

// The World ID Migration `app_id` is the `client_id` used to configure the legacy Sign in
// With World ID auth0 connection. It is a public identifier resolved from a per-env
// dictionary (shared with the frontend) rather than a secret env var.
function getWorldIdMigrationAppId(): `app_${string}` | null {
  const appId =
    WORLD_ID_MIGRATION_APP_IDS[process.env.NEXT_PUBLIC_APP_ENV ?? ""];

  if (!appId || !appIdRegex.test(appId)) {
    return null;
  }

  return appId;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

function parseMigrationProof(
  value: unknown,
):
  | { ok: true; response: ProofV3 }
  | { ok: false; detail: string; attribute: string | null } {
  const result = value as Partial<ProofV3> | null;

  if (!result || typeof result !== "object") {
    return {
      ok: false,
      detail: "Proof payload is missing.",
      attribute: null,
    };
  }

  for (const attribute of [
    "proof",
    "merkle_root",
    "nullifier",
    "signal_hash",
    "verification_level",
  ] as const) {
    if (!isNonEmptyString(result[attribute])) {
      return {
        ok: false,
        detail: `Proof is missing a valid "${attribute}".`,
        attribute,
      };
    }
  }

  return {
    ok: true,
    response: {
      verification_level: result.verification_level as LegacyVerificationLevel,
      proof: result.proof as string,
      merkle_root: result.merkle_root as string,
      nullifier: result.nullifier as string,
      signal_hash: result.signal_hash as string,
    },
  };
}

function getNullifierLookupValues(nullifier: string): string[] {
  const normalized = normalizeNullifierHash(nullifier);
  const withoutPrefix = normalized.replace(/^0x/, "");

  return Array.from(new Set([nullifier, normalized, withoutPrefix]));
}

export async function POST(req: NextRequest) {
  const session = await auth0.getSession(toSessionRequest(req));
  if (!session) {
    return errorUnauthenticated("You must be logged in.", req);
  }

  const auth0User = session.user as Auth0SessionUser["user"];
  const currentUserId = auth0User?.hasura?.id;
  if (!currentUserId) {
    return errorUnauthenticated("Your session is missing user context.", req);
  }

  // A Sign in with World ID session IS a legacy account — there is nothing to
  // migrate it into. The migration must run from the (email) account that
  // should absorb the legacy one.
  if (auth0User && isWorldUser(auth0User)) {
    logger.warn(
      "World ID account migration rejected for a Sign in with World ID session",
      { currentUserId },
    );
    return errorResponse({
      statusCode: 403,
      code: "world_id_session",
      detail:
        "You are signed in with World ID. Log in with your email account to migrate this account into it.",
      attribute: null,
      req,
    });
  }

  const appId = getWorldIdMigrationAppId();
  if (!appId) {
    return errorResponse({
      statusCode: 500,
      code: "missing_configuration",
      detail: "World ID account migration is not configured.",
      attribute: "NEXT_PUBLIC_APP_ENV",
      req,
    });
  }

  // Feature flag (opt-in): the restoration flow ships dark and is enabled
  // per environment. The server reads this at runtime, so unsetting it also
  // acts as the kill switch — the merge neutralizes legacy accounts, so we
  // keep a way to stop it without a deploy. The same flag gates the UI
  // (inlined client-side at build time).
  if (process.env.NEXT_PUBLIC_ENABLE_WORLD_ID_RESTORATION !== "true") {
    logger.warn("World ID account restoration is disabled", {
      currentUserId,
    });
    return errorResponse({
      statusCode: 503,
      code: "restoration_disabled",
      detail: "World ID account restoration is not available.",
      attribute: null,
      req,
      app_id: appId,
    });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch (error) {
    logger.warn("Invalid JSON in World ID account migration request", {
      error,
    });
    return errorResponse({
      statusCode: 400,
      code: "invalid_request",
      detail: "Invalid JSON in request body.",
      attribute: null,
      req,
      app_id: appId,
    });
  }

  const parsed = parseMigrationProof(body);
  if (!parsed.ok) {
    return errorResponse({
      statusCode: 400,
      code: "invalid_request",
      detail: parsed.detail,
      attribute: parsed.attribute,
      req,
      app_id: appId,
    });
  }

  const { response } = parsed;
  const client = await getAPIServiceGraphqlClient();

  // Sign in With World ID uses the empty action, so its external nullifier is
  // derived from the app_id alone — no need to look up the app/action in the DB.
  const externalNullifier = generateExternalNullifier(appId, ACTION).digest;

  const verification = await verifyProof(
    {
      signal_hash: response.signal_hash,
      proof: response.proof,
      merkle_root: response.merkle_root,
      nullifier_hash: response.nullifier,
      external_nullifier: externalNullifier,
    },
    {
      // These migration apps are cloud, non-staging apps.
      is_staging: false,
      // The migration flow only ever requests device-legacy proofs
      // (frontend uses the `deviceLegacy()` preset), so the verification
      // level is fixed rather than read from the request.
      verification_level:
        response.verification_level as LegacyVerificationLevel,
    },
  );

  if (verification.error || !verification.success) {
    return errorResponse({
      statusCode: verification.error?.statusCode || 400,
      code: verification.error?.code || "verification_error",
      detail:
        verification.error?.message ||
        "There was an error verifying this World ID proof.",
      attribute: verification.error?.attribute || null,
      req,
      app_id: appId,
    });
  }

  const nullifierLookupValues = getNullifierLookupValues(response.nullifier);
  const userResponse = await getFetchUserByWorldIdNullifierSdk(
    client,
  ).FetchUserByWorldIdNullifier({
    world_id_nullifiers: nullifierLookupValues,
    current_user_id: currentUserId,
  });

  const matchingUsers = userResponse.user;
  const linkedToCurrentUser = matchingUsers.some(
    (user) => user.id === currentUserId,
  );
  const legacyUsers = matchingUsers.filter((user) => user.id !== currentUserId);

  // This nullifier is already on the current user and nobody else — no-op.
  if (linkedToCurrentUser && legacyUsers.length === 0) {
    return NextResponse.json({ status: "already_linked" });
  }

  // There is no unique constraint on world_id_nullifier, so more than one
  // other account holding this nullifier is possible in theory. Merging is
  // ambiguous — abort without writing and leave a trail for manual handling.
  if (legacyUsers.length > 1) {
    logger.error(
      "World ID account migration matched more than one legacy account",
      {
        currentUserId,
        matchedUserIds: matchingUsers.map((user) => user.id),
      },
    );
    return errorResponse({
      statusCode: 500,
      code: "migration_conflict",
      detail:
        "This World ID matches more than one account. Please contact support.",
      attribute: null,
      req,
      app_id: appId,
    });
  }

  const legacyUser = legacyUsers[0] ?? null;

  // No legacy Sign in with World ID account holds this World ID — there is
  // nothing to migrate, so tell the user and write nothing. This endpoint
  // deliberately does NOT link the World ID to users without a legacy
  // account; its only purpose is migrating old accounts.
  if (!legacyUser) {
    logger.info("World ID account migration found no legacy account", {
      currentUserId,
      status: "not_found",
    });
    return NextResponse.json({ status: "not_found" });
  }

  // Overwrite guard: never silently replace a different World ID that is
  // already linked to this account. The merge function re-checks this inside
  // the transaction; this pre-check exists to give a clean 409 (Hasura masks
  // the function's exception message for non-admin roles).
  const currentNullifier = userResponse.current_user?.world_id_nullifier;
  if (
    currentNullifier &&
    normalizeNullifierHash(currentNullifier) !==
      normalizeNullifierHash(response.nullifier)
  ) {
    logger.warn(
      "World ID account migration blocked: user already linked to another World ID",
      { currentUserId, legacyUserId: legacyUser.id },
    );
    return errorResponse({
      statusCode: 409,
      code: "already_linked_other",
      detail: "This account is already linked to a different World ID.",
      attribute: null,
      req,
      app_id: appId,
    });
  }

  // All writes happen in the merge_world_id_accounts Postgres function, in
  // one transaction: the legacy account's memberships move to the current
  // user (teams and their apps ride along, they are team-scoped), the
  // nullifier is handed over and the legacy row is neutralized so World ID
  // login resolves to exactly one user.
  try {
    await getMergeWorldIdAccountsSdk(client).MergeWorldIdAccounts({
      current_user_id: currentUserId,
      legacy_user_id: legacyUser.id,
      world_id_nullifier: normalizeNullifierHash(response.nullifier),
    });
  } catch (error) {
    logger.error("World ID account migration merge failed", {
      error,
      currentUserId,
      legacyUserId: legacyUser.id,
    });
    return errorResponse({
      statusCode: 500,
      code: "migration_failed",
      detail: "There was an error merging this World ID account.",
      attribute: null,
      req,
      app_id: appId,
    });
  }

  // Audit record: the merge just neutralized the legacy row and moved its
  // memberships, so this log is the only pre-merge record of what it held.
  const currentTeamIds =
    userResponse.current_user?.memberships.map(
      (membership) => membership.team_id,
    ) ?? [];
  logger.info("Merged legacy World ID account", {
    currentUserId,
    legacyUserId: legacyUser.id,
    legacyMemberships: legacyUser.memberships,
    currentTeamIds,
    status: "merged",
  });
  return NextResponse.json({ status: "merged" });
}
