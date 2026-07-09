import type { RpContext } from "@worldcoin/idkit";

export type MigrationConfig = {
  app_id: `app_${string}`;
  action: "";
  rp_context: RpContext;
};

export type MigrationStatus = "merged" | "already_linked" | "not_found";

export type MigrationResponse = {
  status: MigrationStatus;
};

export type MigrationState =
  | { type: "idle" }
  | { type: "checking" }
  | { type: "error"; message: string }
  | { type: MigrationStatus };
