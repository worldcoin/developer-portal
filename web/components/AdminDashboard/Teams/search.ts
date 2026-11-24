import {
  getSearchVisualSegments,
  parseSearchTokens,
  type ParsedSearchToken,
  type SearchOperator,
} from "../common/search-tokens";
import type { SearchVisualSegment } from "../common/types";

export const parseTeamsSearchQuery = (query: string | string[] | undefined) => {
  const rawQuery = Array.isArray(query) ? query[0] : query;

  return rawQuery?.trim() ?? "";
};

export type TeamsSearchFieldType = "string" | "number" | "date";

export type TeamsSearchField =
  | "id"
  | "name"
  | "status"
  | "members"
  | "owners"
  | "apps"
  | "api_keys"
  | "created";

export type TeamsSearchOperator = SearchOperator;

export type ParsedTeamsSearchToken = ParsedSearchToken<TeamsSearchField>;

export const TEAMS_SEARCH_FIELDS: Array<{
  field: TeamsSearchField;
  label: string;
  type: TeamsSearchFieldType;
  examples: string[];
}> = [
  {
    field: "id",
    label: "ID",
    type: "string",
    examples: ["id:team_"],
  },
  {
    field: "name",
    label: "Name",
    type: "string",
    examples: ['name:"Testing Co"'],
  },
  {
    field: "status",
    label: "Status",
    type: "string",
    examples: ["status:active", "status:deleted"],
  },
  {
    field: "members",
    label: "Members",
    type: "number",
    examples: ["members>=10", "members=0"],
  },
  {
    field: "owners",
    label: "Owners",
    type: "number",
    examples: ["owners:0", "owners:1"],
  },
  {
    field: "apps",
    label: "Apps",
    type: "number",
    examples: ["apps>0", "apps=3"],
  },
  {
    field: "api_keys",
    label: "API keys",
    type: "number",
    examples: ["api_keys>=2", "api_keys=0"],
  },
  {
    field: "created",
    label: "Created",
    type: "date",
    examples: ["created>=2026-01-01", "created<2026-07-01"],
  },
];

const FIELD_ALIASES: Record<string, TeamsSearchField> = {
  id: "id",
  name: "name",
  status: "status",
  members: "members",
  memberships: "members",
  owners: "owners",
  owner: "owners",
  apps: "apps",
  api_keys: "api_keys",
  apikeys: "api_keys",
  created: "created",
  created_at: "created",
};

export const parseTeamsSearchTokens = (
  query: string,
): ParsedTeamsSearchToken[] => parseSearchTokens(query, FIELD_ALIASES);

export type TeamsSearchVisualSegment = SearchVisualSegment;

export const getTeamsSearchVisualSegments = (query: string) =>
  getSearchVisualSegments(query, FIELD_ALIASES);
