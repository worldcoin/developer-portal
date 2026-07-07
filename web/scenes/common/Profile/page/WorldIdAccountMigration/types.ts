export type MigrationState =
  | { type: "idle" }
  | { type: "error"; message: string };
