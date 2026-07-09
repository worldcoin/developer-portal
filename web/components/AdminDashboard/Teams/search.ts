export const parseTeamsSearchQuery = (
  query: string | string[] | undefined,
) => {
  const rawQuery = Array.isArray(query) ? query[0] : query;

  return rawQuery?.trim() ?? "";
};

export type TeamsSearchFieldType = "string" | "number" | "date";

export type TeamsSearchField =
  | "id"
  | "name"
  | "status"
  | "members"
  | "apps"
  | "api_keys"
  | "created";

export type TeamsSearchOperator = ":" | "=" | "!=" | ">" | ">=" | "<" | "<=";

export type ParsedTeamsSearchToken =
  | {
      type: "field";
      field: TeamsSearchField;
      operator: TeamsSearchOperator;
      value: string;
    }
  | {
      type: "plain";
      value: string;
    };

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
  apps: "apps",
  api_keys: "api_keys",
  apiKeys: "api_keys",
  created: "created",
  created_at: "created",
};

const FIELD_TOKEN_PATTERN = /^([A-Za-z_][A-Za-z0-9_]*)(>=|<=|!=|:|=|>|<)(.+)$/;
const FIELD_VISUAL_TOKEN_PATTERN =
  /^([A-Za-z_][A-Za-z0-9_]*)(>=|<=|!=|:|=|>|<)(.*)$/;

const stripQuotes = (value: string) => {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  return value;
};

export const tokenizeTeamsSearchQuery = (query: string) => {
  const tokens: string[] = [];
  let currentToken = "";
  let quote: '"' | "'" | null = null;

  for (const character of query) {
    if ((character === '"' || character === "'") && !quote) {
      quote = character;
      currentToken += character;
      continue;
    }

    if (character === quote) {
      quote = null;
      currentToken += character;
      continue;
    }

    if (/\s/.test(character) && !quote) {
      if (currentToken) {
        tokens.push(currentToken);
        currentToken = "";
      }

      continue;
    }

    currentToken += character;
  }

  if (currentToken) {
    tokens.push(currentToken);
  }

  return tokens;
};

const tokenizeTeamsSearchQueryWithRanges = (query: string) => {
  const tokens: Array<{ end: number; start: number; value: string }> = [];
  let currentToken = "";
  let currentTokenStart = 0;
  let quote: '"' | "'" | null = null;

  for (let index = 0; index < query.length; index += 1) {
    const character = query[index];

    if (!currentToken) {
      currentTokenStart = index;
    }

    if ((character === '"' || character === "'") && !quote) {
      quote = character;
      currentToken += character;
      continue;
    }

    if (character === quote) {
      quote = null;
      currentToken += character;
      continue;
    }

    if (/\s/.test(character) && !quote) {
      if (currentToken) {
        tokens.push({
          end: index,
          start: currentTokenStart,
          value: currentToken,
        });
        currentToken = "";
      }

      continue;
    }

    currentToken += character;
  }

  if (currentToken) {
    tokens.push({
      end: query.length,
      start: currentTokenStart,
      value: currentToken,
    });
  }

  return tokens;
};

export const parseTeamsSearchTokens = (
  query: string,
): ParsedTeamsSearchToken[] => {
  return tokenizeTeamsSearchQuery(query)
    .map((token): ParsedTeamsSearchToken | null => {
      const fieldTokenMatch = token.match(FIELD_TOKEN_PATTERN);

      if (!fieldTokenMatch) {
        return {
          type: "plain",
          value: stripQuotes(token),
        };
      }

      const [, rawField, rawOperator, rawValue] = fieldTokenMatch;
      const field = FIELD_ALIASES[rawField];
      const value = stripQuotes(rawValue.trim());

      if (!field || !value) {
        return {
          type: "plain",
          value: stripQuotes(token),
        };
      }

      return {
        type: "field",
        field,
        operator: rawOperator as TeamsSearchOperator,
        value,
      };
    })
    .filter((token): token is ParsedTeamsSearchToken => Boolean(token));
};

export type TeamsSearchVisualSegment =
  | {
      type: "chip";
      value: string;
    }
  | {
      type: "text";
      value: string;
    };

export const getTeamsSearchVisualSegments = (
  query: string,
): TeamsSearchVisualSegment[] => {
  const segments: TeamsSearchVisualSegment[] = [];
  let lastIndex = 0;

  for (const token of tokenizeTeamsSearchQueryWithRanges(query)) {
    const match = token.value.match(FIELD_VISUAL_TOKEN_PATTERN);

    if (!match) {
      continue;
    }

    const [, rawField] = match;
    const field = FIELD_ALIASES[rawField];

    if (!field) {
      continue;
    }

    if (token.start > lastIndex) {
      segments.push({
        type: "text",
        value: query.slice(lastIndex, token.start),
      });
    }

    segments.push({
      type: "chip",
      value: token.value,
    });
    lastIndex = token.end;
  }

  if (lastIndex < query.length) {
    segments.push({
      type: "text",
      value: query.slice(lastIndex),
    });
  }

  if (segments.length === 0) {
    return [
      {
        type: "text",
        value: query,
      },
    ];
  }

  return segments;
};
