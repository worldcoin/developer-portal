import "server-only";

import { generateRpIdString } from "@/lib/rp";
import { gql, GraphQLClient } from "graphql-request";

// A nonzero burn address with no known private key. Never use a generated key.
export const RP_RESERVATION_SIGNER =
  "0x000000000000000000000000000000000000dEaD";
export const RP_BACKFILL_LOCK = 824701;
export type Registry = "production" | "staging";
export type BackfillStatus =
  | "unused"
  | "in_progress"
  | "reserved"
  | "already_registered"
  | "claimed_by_other";
export type BackfillRow = {
  app_id: string;
  rp_id: string;
  production_status: BackfillStatus;
  production_request_id: string | null;
  staging_status: BackfillStatus;
  staging_request_id: string | null;
};

export function rpSetupPaused() {
  return process.env.RP_SETUP_PAUSED === "true";
}

export async function getRpBackfill(client: GraphQLClient, appId: string) {
  const data = await client.request<{
    rp_id_backfill_by_pk: BackfillRow | null;
  }>(
    gql`
      query RpBackfill($app_id: String!) {
        rp_id_backfill_by_pk(app_id: $app_id) {
          app_id
          rp_id
          production_status
          production_request_id
          staging_status
          staging_request_id
        }
      }
    `,
    { app_id: appId },
  );
  const row = data.rp_id_backfill_by_pk;
  if (row && row.rp_id !== generateRpIdString(appId)) {
    throw new Error("Backfill RP ID does not match app");
  }
  return row;
}

export function reservationBlocksSetup(
  row: BackfillRow | null,
  selfManaged = false,
) {
  return (
    !!row &&
    [row.production_status, row.staging_status].some(
      (status) =>
        status === "in_progress" || (selfManaged && status === "reserved"),
    )
  );
}

export async function finalizeRpBackfill(
  client: GraphQLClient,
  appId: string,
  registry: Registry,
) {
  await client.request(
    gql`
    mutation FinalizeRpBackfill($app_id: String!) {
      update_rp_id_backfill(
        where: { app_id: { _eq: $app_id }, ${registry}_status: { _in: ["reserved", "unused"] } }
        _set: { ${registry}_status: "already_registered" }
      ) { affected_rows }
    }
  `,
    { app_id: appId },
  );
}

/** A legacy registration with no staging attempt keeps its existing status flow. */
export function needsRpActivationStatus(
  row: BackfillRow | null,
  stagingStatus: unknown,
) {
  return (
    !!row &&
    (row.production_status === "reserved" ||
      row.staging_status === "reserved" ||
      row.production_status === "unused" ||
      (row.staging_status === "unused" && stagingStatus != null))
  );
}

/** Maintenance must not overwrite a reservation or an unresolved activation. */
export function reservationBlocksMaintenance(
  row: BackfillRow | null,
  registration: { status: unknown; staging_status?: unknown },
) {
  return (
    reservationBlocksSetup(row, true) ||
    (!!row &&
      ((row.production_status === "unused" &&
        registration.status === "pending") ||
        (row.staging_status === "unused" &&
          registration.staging_status === "pending")))
  );
}

// Passed only for worklist apps. The DB check closes the race with a staging retry.
export const SETTLED_STAGING_FILTER = {
  _or: [
    { staging_status: { _is_null: true } },
    { staging_status: { _neq: "pending" } },
  ],
};
