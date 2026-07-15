import type { SearchField } from "../common/types";

export const parseAppsSearchQuery = (query: string | string[] | undefined) => {
  const rawQuery = Array.isArray(query) ? query[0] : query;
  return rawQuery?.trim() ?? "";
};

export type AppsSearchField =
  | "draft"
  | "id"
  | "name"
  | "team"
  | "verified"
  | "created";
export type AppsSearchOperator = ":" | "=" | "!=" | ">" | ">=" | "<" | "<=";
export type ParsedAppsSearchToken =
  | {
      field: AppsSearchField;
      operator: AppsSearchOperator;
      type: "field";
      value: string;
    }
  | { type: "plain"; value: string };

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
  name: "name",
  team: "team",
  team_id: "team",
  verified: "verified",
};
const FIELD_TOKEN_PATTERN = /^([A-Za-z_][A-Za-z0-9_]*)(>=|<=|!=|:|=|>|<)(.+)$/;
const FIELD_VISUAL_TOKEN_PATTERN =
  /^([A-Za-z_][A-Za-z0-9_]*)(>=|<=|!=|:|=|>|<)(.*)$/;

const stripQuotes = (value: string) =>
  (value.startsWith('"') && value.endsWith('"')) ||
  (value.startsWith("'") && value.endsWith("'"))
    ? value.slice(1, -1)
    : value;

export const parseAppsSearchTokens = (query: string): ParsedAppsSearchToken[] =>
  query.match(/(?:"[^"]*"|'[^']*'|\S)+/g)?.map((token) => {
    const match = token.match(FIELD_TOKEN_PATTERN);

    if (!match) {
      return { type: "plain", value: stripQuotes(token) };
    }

    const [, rawField, rawOperator, rawValue] = match;
    const field = FIELD_ALIASES[rawField];
    const value = stripQuotes(rawValue.trim());

    return field && value
      ? {
          field,
          operator: rawOperator as AppsSearchOperator,
          type: "field",
          value,
        }
      : { type: "plain", value: stripQuotes(token) };
  }) ?? [];

export const getAppsSearchVisualSegments = (query: string) => {
  const segments: Array<{ type: "chip" | "text"; value: string }> = [];
  let lastIndex = 0;

  for (const match of query.matchAll(/(?:"[^"]*"|'[^']*'|\S)+/g)) {
    if (!match[0].match(FIELD_VISUAL_TOKEN_PATTERN)) {
      continue;
    }

    const field = match[0].match(FIELD_VISUAL_TOKEN_PATTERN)?.[1];
    if (!field || !FIELD_ALIASES[field] || match.index === undefined) {
      continue;
    }

    if (match.index > lastIndex) {
      segments.push({
        type: "text",
        value: query.slice(lastIndex, match.index),
      });
    }
    segments.push({ type: "chip", value: match[0] });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < query.length) {
    segments.push({ type: "text", value: query.slice(lastIndex) });
  }

  return segments.length > 0
    ? segments
    : [{ type: "text" as const, value: query }];
};
