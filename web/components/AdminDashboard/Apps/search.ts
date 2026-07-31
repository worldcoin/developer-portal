import type { SearchField } from "../common/types";
import {
  getSearchVisualSegments,
  parseSearchTokens,
  type ParsedSearchToken,
  type SearchOperator,
} from "../common/search-tokens";

export const parseAppsSearchQuery = (query: string | string[] | undefined) => {
  const rawQuery = Array.isArray(query) ? query[0] : query;
  return rawQuery?.trim() ?? "";
};

export type AppsSearchField =
  | "draft"
  | "id"
  | "metadata"
  | "name"
  | "review"
  | "team"
  | "verified"
  | "created";
export type AppsSearchOperator = SearchOperator;
export type ParsedAppsSearchToken = ParsedSearchToken<AppsSearchField>;

export const APPS_SEARCH_FIELDS: Array<SearchField & { label: string }> = [
  { field: "id", label: "ID", type: "string", examples: ["id:app_"] },
  {
    field: "name",
    label: "App name",
    type: "string",
    examples: ['name:"World App"'],
  },
  { field: "team", label: "Team ID", type: "string", examples: ["team:team_"] },
  {
    field: "review",
    label: "Review status",
    type: "string",
    examples: ["review:awaiting_review", "review:changes_requested"],
  },
  {
    field: "metadata",
    label: "Metadata",
    type: "string",
    examples: ["metadata:none"],
  },
  {
    field: "draft",
    label: "Draft metadata",
    type: "string",
    examples: ["draft:example"],
  },
  {
    field: "verified",
    label: "Verified metadata",
    type: "string",
    examples: ["verified:example"],
  },
  {
    field: "created",
    label: "Created",
    type: "date",
    examples: ["created>=2026-01-01"],
  },
];

const FIELD_ALIASES: Record<string, AppsSearchField> = {
  created: "created",
  created_at: "created",
  draft: "draft",
  id: "id",
  metadata: "metadata",
  name: "name",
  review: "review",
  status: "review",
  team: "team",
  team_id: "team",
  verification: "review",
  verification_status: "review",
  verified: "verified",
};

export const parseAppsSearchTokens = (query: string): ParsedAppsSearchToken[] =>
  parseSearchTokens(query, FIELD_ALIASES);

export const getAppsSearchVisualSegments = (query: string) =>
  getSearchVisualSegments(query, FIELD_ALIASES);
