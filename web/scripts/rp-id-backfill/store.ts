import {
  backfillColumns,
  type BackfillIdentity,
  type BackfillRegistry,
  type BackfillRow,
  type BackfillStatus,
} from "@/lib/rp-id-backfill";
import { Client } from "pg";

const LOCK_NAMESPACE = 17482;
const LOCK_ID = 4001;

export type ScanApp = { app_id: string; has_registration: boolean };
export type Resolution = BackfillIdentity & { status: BackfillStatus };

export class BatchNoLongerEligibleError extends Error {}

/** A dedicated connection holds the same session lock across BOTH CLI commands. */
export class BackfillStore {
  private usable = true;
  private held = false;

  constructor(private readonly client: Client) {
    client.on("error", () => {
      this.usable = false;
    });
    client.on("end", () => {
      this.usable = false;
    });
  }

  async lock() {
    const result = await this.client.query<{ acquired: boolean }>(
      "SELECT pg_try_advisory_lock($1, $2) AS acquired",
      [LOCK_NAMESPACE, LOCK_ID],
    );
    this.held = result.rows[0].acquired;
    if (!this.held)
      throw new Error("Another RP backfill command holds the lock");
  }

  async assertLocked() {
    if (!this.usable || !this.held)
      throw new Error("Backfill database lock lost");
    const { rows } = await this.client.query<{ held: boolean }>(
      `SELECT EXISTS (SELECT 1 FROM pg_locks WHERE pid = pg_backend_pid()
       AND locktype = 'advisory' AND classid = $1::oid AND objid = $2::oid
       AND objsubid = 2 AND granted) AS held`,
      [LOCK_NAMESPACE, LOCK_ID],
    );
    if (!rows[0].held) {
      this.held = false;
      throw new Error("Backfill database lock lost");
    }
  }

  async unlock() {
    if (this.usable && this.held) {
      await this.client.query("SELECT pg_advisory_unlock($1, $2)", [
        LOCK_NAMESPACE,
        LOCK_ID,
      ]);
    }
    this.held = false;
  }

  async assertEmpty() {
    const result = await this.client.query(
      "SELECT 1 FROM rp_id_backfill LIMIT 1",
    );
    if (result.rowCount)
      throw new Error("Scan requires an empty rp_id_backfill table");
  }

  async loadApps(cutoff: string): Promise<ScanApp[]> {
    const { rows } = await this.client.query<ScanApp>(
      `SELECT a.id AS app_id, EXISTS (
         SELECT 1 FROM rp_registration r WHERE r.app_id = a.id
       ) AS has_registration
       FROM app a WHERE a.is_staging = false AND a.deleted_at IS NULL
       AND a.created_at < $1::timestamptz ORDER BY a.id`,
      [cutoff],
    );
    return rows;
  }

  private async transaction<T>(work: () => Promise<T>): Promise<T> {
    await this.assertLocked();
    await this.client.query("BEGIN");
    try {
      const value = await work();
      await this.client.query("COMMIT");
      return value;
    } catch (error) {
      await this.client.query("ROLLBACK");
      throw error;
    }
  }

  async initialize(rows: BackfillRow[]) {
    await this.transaction(async () => {
      await this.client.query("LOCK TABLE rp_id_backfill IN EXCLUSIVE MODE");
      await this.assertEmpty();
      await this.client.query(
        `INSERT INTO rp_id_backfill SELECT * FROM jsonb_to_recordset($1::jsonb)
         AS x(app_id text, rp_id text, production_status text,
              production_request_id text, staging_status text, staging_request_id text)`,
        [JSON.stringify(rows)],
      );
    });
  }

  async candidates(
    registry: BackfillRegistry,
    after: string,
    limit: number,
  ): Promise<BackfillIdentity[]> {
    const { status } = backfillColumns(registry);
    const { rows } = await this.client.query<BackfillIdentity>(
      `SELECT b.app_id, b.rp_id FROM rp_id_backfill b JOIN app a ON a.id = b.app_id
       WHERE b.${status} = 'unused' AND b.app_id > $1
       AND a.is_staging = false AND a.deleted_at IS NULL
       AND NOT EXISTS (SELECT 1 FROM rp_registration r WHERE r.app_id = b.app_id)
       ORDER BY b.app_id LIMIT $2`,
      [after, limit],
    );
    return rows;
  }

  async claim(
    registry: BackfillRegistry,
    batch: BackfillIdentity[],
    requestId: string,
  ) {
    const { status, request } = backfillColumns(registry);
    await this.transaction(async () => {
      const result = await this.client.query(
        `UPDATE rp_id_backfill b SET ${status} = 'in_progress', ${request} = $2
         WHERE b.app_id = ANY($1::text[]) AND b.${status} = 'unused'
         AND EXISTS (SELECT 1 FROM app a WHERE a.id = b.app_id AND a.is_staging = false AND a.deleted_at IS NULL)
         AND NOT EXISTS (SELECT 1 FROM rp_registration r WHERE r.app_id = b.app_id)`,
        [batch.map((row) => row.app_id), requestId],
      );
      if (result.rowCount !== batch.length) {
        throw new BatchNoLongerEligibleError(
          "Batch eligibility changed before submission",
        );
      }
    });
  }

  async batch(
    registry: BackfillRegistry,
    requestId: string,
  ): Promise<BackfillIdentity[]> {
    const { status, request } = backfillColumns(registry);
    const { rows } = await this.client.query<BackfillIdentity>(
      `SELECT app_id, rp_id FROM rp_id_backfill WHERE ${status} = 'in_progress'
       AND ${request} = $1 ORDER BY app_id`,
      [requestId],
    );
    return rows;
  }

  async registeredApps(appIds: string[]): Promise<Set<string>> {
    const { rows } = await this.client.query<{ app_id: string }>(
      "SELECT app_id FROM rp_registration WHERE app_id = ANY($1::text[])",
      [appIds],
    );
    return new Set(rows.map((row) => row.app_id));
  }

  async resolve(
    registry: BackfillRegistry,
    requestId: string,
    rows: Resolution[],
  ) {
    const { status, request } = backfillColumns(registry);
    await this.transaction(async () => {
      const result = await this.client.query(
        `UPDATE rp_id_backfill b SET ${status} = resolved.status, ${request} = NULL
         FROM jsonb_to_recordset($1::jsonb) AS resolved(app_id text, rp_id text, status text)
         WHERE b.app_id = resolved.app_id AND b.rp_id = resolved.rp_id
         AND b.${status} = 'in_progress' AND b.${request} = $2`,
        [JSON.stringify(rows), requestId],
      );
      if (result.rowCount !== rows.length)
        throw new Error("Backfill request changed during reconciliation");
    });
  }
}
