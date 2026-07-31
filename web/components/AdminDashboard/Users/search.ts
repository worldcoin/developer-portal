import {
  getSearchVisualSegments,
  parseSearchTokens,
  type ParsedSearchToken,
  type SearchOperator,
} from "../common/search-tokens";
import type { SearchVisualSegment } from "../common/types";

export const parseUsersSearchQuery = (query: string | string[] | undefined) => {
  const rawQuery = Array.isArray(query) ? query[0] : query;

  return rawQuery?.trim() ?? "";
};

export type UsersSearchFieldType = "string" | "number" | "date";

export type UsersSearchField = "id" | "name" | "email" | "teams" | "created";

export type UsersSearchOperator = SearchOperator;

export type ParsedUsersSearchToken = ParsedSearchToken<UsersSearchField>;

export const USERS_SEARCH_FIELDS: Array<{
  field: UsersSearchField;
  label: string;
  type: UsersSearchFieldType;
  examples: string[];
}> = [
  {
    field: "id",
    label: "ID",
    type: "string",
    examples: ["id:user_"],
  },
  {
    field: "name",
    label: "Name",
    type: "string",
    examples: ['name:"Testing Co"'],
  },
  {
    field: "email",
    label: "Email",
    type: "string",
    examples: ["email:example.com"],
  },
  {
    field: "teams",
    label: "Teams",
    type: "number",
    examples: ["teams>=2", "teams=0"],
  },
  {
    field: "created",
    label: "Created",
    type: "date",
    examples: ["created>=2026-01-01", "created<2026-07-01"],
  },
];

const FIELD_ALIASES: Record<string, UsersSearchField> = {
  id: "id",
  name: "name",
  email: "email",
  teams: "teams",
  memberships: "teams",
  created: "created",
  created_at: "created",
};

export const parseUsersSearchTokens = (
  query: string,
): ParsedUsersSearchToken[] => parseSearchTokens(query, FIELD_ALIASES);

export type UsersSearchVisualSegment = SearchVisualSegment;

export const getUsersSearchVisualSegments = (query: string) =>
  getSearchVisualSegments(query, FIELD_ALIASES);
