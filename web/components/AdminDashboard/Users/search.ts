export const parseUsersSearchQuery = (query: string | string[] | undefined) => {
  const rawQuery = Array.isArray(query) ? query[0] : query;

  return rawQuery?.trim() ?? "";
};

export type UsersSearchFieldType = "string" | "number" | "date";

export type UsersSearchField = "id" | "name" | "email" | "teams" | "created";

export type UsersSearchOperator = ":" | "=" | "!=" | ">" | ">=" | "<" | "<=";

export type ParsedUsersSearchToken =
  | {
      type: "field";
      field: UsersSearchField;
      operator: UsersSearchOperator;
      value: string;
    }
  | {
      type: "plain";
      value: string;
    };

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

export const tokenizeUsersSearchQuery = (query: string) => {
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

const tokenizeUsersSearchQueryWithRanges = (query: string) => {
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

export const parseUsersSearchTokens = (
  query: string,
): ParsedUsersSearchToken[] => {
  return tokenizeUsersSearchQuery(query)
    .map((token): ParsedUsersSearchToken | null => {
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
        operator: rawOperator as UsersSearchOperator,
        value,
      };
    })
    .filter((token): token is ParsedUsersSearchToken => Boolean(token));
};

export type UsersSearchVisualSegment =
  | {
      type: "chip";
      value: string;
    }
  | {
      type: "text";
      value: string;
    };

export const getUsersSearchVisualSegments = (
  query: string,
): UsersSearchVisualSegment[] => {
  const segments: UsersSearchVisualSegment[] = [];
  let lastIndex = 0;

  for (const token of tokenizeUsersSearchQueryWithRanges(query)) {
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
