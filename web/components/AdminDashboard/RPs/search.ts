import type { SearchField } from "../common/types";
import {
  getSearchVisualSegments,
  parseSearchTokens,
  type ParsedSearchToken,
  type SearchOperator,
} from "../common/search-tokens";

export const parseRpsSearchQuery = (query: string | string[] | undefined) => {
  const rawQuery = Array.isArray(query) ? query[0] : query;
  return rawQuery?.trim() ?? "";
};

export type RpsSearchField =
  | "app"
  | "app_name"
  | "created"
  | "mode"
  | "operation"
  | "rp"
  | "signer"
  | "staging_operation"
  | "staging_status"
  | "status"
  | "team"
  | "updated";
export type RpsSearchOperator = SearchOperator;
export type ParsedRpsSearchToken = ParsedSearchToken<RpsSearchField>;

export const RPS_SEARCH_FIELDS: Array<SearchField & { label: string }> = [
  { field: "rp", label: "RP ID", type: "string", examples: ["rp:rp_"] },
  { field: "app", label: "App ID", type: "string", examples: ["app:app_"] },
  {
    field: "app_name",
    label: "App name",
    type: "string",
    examples: ['app_name:"World App"'],
  },
  { field: "team", label: "Team ID", type: "string", examples: ["team:team_"] },
  {
    field: "mode",
    label: "Mode",
    type: "string",
    examples: ["mode:managed"],
  },
  {
    field: "status",
    label: "Production status",
    type: "string",
    examples: ["status:registered"],
  },
  {
    field: "staging_status",
    label: "Staging status",
    type: "string",
    examples: ["staging_status:pending"],
  },
  {
    field: "signer",
    label: "Signer",
    type: "string",
    examples: ["signer:0x"],
  },
  {
    field: "operation",
    label: "Operation hash",
    type: "string",
    examples: ["operation:0x"],
  },
  {
    field: "staging_operation",
    label: "Staging operation hash",
    type: "string",
    examples: ["staging_operation:0x"],
  },
  {
    field: "created",
    label: "Created",
    type: "date",
    examples: ["created>=2026-01-01"],
  },
  {
    field: "updated",
    label: "Updated",
    type: "date",
    examples: ["updated>=2026-01-01"],
  },
];

const FIELD_ALIASES: Record<string, RpsSearchField> = {
  app: "app",
  app_id: "app",
  app_name: "app_name",
  created: "created",
  created_at: "created",
  mode: "mode",
  operation: "operation",
  operation_hash: "operation",
  rp: "rp",
  rp_id: "rp",
  signer: "signer",
  signer_address: "signer",
  staging: "staging_status",
  staging_operation: "staging_operation",
  staging_operation_hash: "staging_operation",
  staging_status: "staging_status",
  status: "status",
  team: "team",
  team_id: "team",
  updated: "updated",
  updated_at: "updated",
};

export const parseRpsSearchTokens = (query: string): ParsedRpsSearchToken[] =>
  parseSearchTokens(query, FIELD_ALIASES);

export const getRpsSearchVisualSegments = (query: string) =>
  getSearchVisualSegments(query, FIELD_ALIASES);
