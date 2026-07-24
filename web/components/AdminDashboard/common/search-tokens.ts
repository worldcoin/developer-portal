import type { SearchVisualSegment } from "./types";

export type SearchOperator = ":" | "=" | "!=" | ">" | ">=" | "<" | "<=";

export type ParsedSearchToken<TField extends string> =
  | {
      field: TField;
      operator: SearchOperator;
      type: "field";
      value: string;
    }
  | {
      type: "plain";
      value: string;
    };

type TokenWithRange = {
  end: number;
  start: number;
  value: string;
};

const FIELD_TOKEN_PATTERN = /^([A-Za-z_][A-Za-z0-9_]*)(>=|<=|!=|:|=|>|<)(.+)$/;
const FIELD_VISUAL_TOKEN_PATTERN =
  /^([A-Za-z_][A-Za-z0-9_]*)(>=|<=|!=|:|=|>|<)(.*)$/;

const stripBalancedQuotes = (value: string) =>
  (value.startsWith('"') && value.endsWith('"')) ||
  (value.startsWith("'") && value.endsWith("'"))
    ? value.slice(1, -1)
    : value;

const tokenizeWithRanges = (query: string): TokenWithRange[] => {
  const tokens: TokenWithRange[] = [];
  let tokenStart = 0;
  let tokenValue = "";
  let quote: '"' | "'" | null = null;

  for (let index = 0; index < query.length; index += 1) {
    const character = query[index];

    if (!tokenValue) {
      tokenStart = index;
    }

    if ((character === '"' || character === "'") && !quote) {
      quote = character;
      tokenValue += character;
      continue;
    }

    if (character === quote) {
      quote = null;
      tokenValue += character;
      continue;
    }

    if (/\s/.test(character) && !quote) {
      if (tokenValue) {
        tokens.push({ end: index, start: tokenStart, value: tokenValue });
        tokenValue = "";
      }
      continue;
    }

    tokenValue += character;
  }

  if (tokenValue) {
    tokens.push({ end: query.length, start: tokenStart, value: tokenValue });
  }

  return tokens;
};

const resolveField = <TField extends string>(
  aliases: Record<string, TField>,
  rawField: string,
) => aliases[rawField.toLowerCase()];

export const tokenizeSearchQuery = (query: string) =>
  tokenizeWithRanges(query).map((token) => token.value);

const INCOMPLETE_FIELD_PATTERN = /^([A-Za-z_][A-Za-z0-9_]*)(>=|<=|!=|:|=|>|<)$/;

const normalizeSearchValue = (value: string) =>
  stripBalancedQuotes(value.replace(/[\u200B-\u200D\uFEFF]/g, "").trim());

const parseFieldToken = <TField extends string>(
  aliases: Record<string, TField>,
  rawField: string,
  rawOperator: string,
  rawValue: string,
): ParsedSearchToken<TField> | null => {
  const field = resolveField(aliases, rawField);
  const value = normalizeSearchValue(rawValue);

  return field && value
    ? {
        field,
        operator: rawOperator as SearchOperator,
        type: "field",
        value,
      }
    : null;
};

export const parseSearchTokens = <TField extends string>(
  query: string,
  aliases: Record<string, TField>,
): ParsedSearchToken<TField>[] => {
  const tokens = tokenizeWithRanges(query);
  const parsed: ParsedSearchToken<TField>[] = [];

  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    const completeMatch = token.value.match(FIELD_TOKEN_PATTERN);

    if (completeMatch) {
      const [, rawField, rawOperator, rawValue] = completeMatch;
      parsed.push(
        parseFieldToken(aliases, rawField, rawOperator, rawValue) ?? {
          type: "plain",
          value: stripBalancedQuotes(token.value),
        },
      );
      continue;
    }

    const incompleteMatch = token.value.match(INCOMPLETE_FIELD_PATTERN);
    const nextToken = tokens[index + 1];

    if (incompleteMatch && nextToken) {
      const [, rawField, rawOperator] = incompleteMatch;
      const fieldToken = parseFieldToken(
        aliases,
        rawField,
        rawOperator,
        nextToken.value,
      );

      if (fieldToken) {
        parsed.push(fieldToken);
        index += 1;
        continue;
      }
    }

    parsed.push({ type: "plain", value: stripBalancedQuotes(token.value) });
  }

  return parsed;
};

export const parseSingleSearchToken = <TField extends string>(
  query: string,
  aliases: Record<string, TField>,
) => {
  const [token] = parseSearchTokens(query, aliases);

  return token?.type === "field"
    ? { field: token.field, value: token.value }
    : { field: null, value: token?.value ?? "" };
};

export const getSearchVisualSegments = <TField extends string>(
  query: string,
  aliases: Record<string, TField>,
): SearchVisualSegment[] => {
  const segments: SearchVisualSegment[] = [];
  const tokens = tokenizeWithRanges(query);
  let lastIndex = 0;

  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    const completeMatch = token.value.match(FIELD_VISUAL_TOKEN_PATTERN);
    const incompleteMatch = token.value.match(INCOMPLETE_FIELD_PATTERN);
    const nextToken = tokens[index + 1];

    const completeField =
      completeMatch &&
      resolveField(aliases, completeMatch[1]) &&
      completeMatch[3]
        ? {
            end: token.end,
            start: token.start,
            value: token.value,
          }
        : null;

    const mergedField =
      !completeField &&
      incompleteMatch &&
      resolveField(aliases, incompleteMatch[1]) &&
      nextToken
        ? {
            end: nextToken.end,
            start: token.start,
            value: `${token.value}${query.slice(token.end, nextToken.start)}${nextToken.value}`,
          }
        : null;

    const fieldSegment = completeField ?? mergedField;

    if (!fieldSegment) {
      continue;
    }

    if (mergedField) {
      index += 1;
    }

    if (fieldSegment.start > lastIndex) {
      segments.push({
        type: "text",
        value: query.slice(lastIndex, fieldSegment.start),
      });
    }

    segments.push({ type: "chip", value: fieldSegment.value });
    lastIndex = fieldSegment.end;
  }

  if (lastIndex < query.length) {
    segments.push({ type: "text", value: query.slice(lastIndex) });
  }

  return segments.length > 0 ? segments : [{ type: "text", value: query }];
};

export const parseDateSearchValue = (value: string) => {
  const dateOnlyMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (dateOnlyMatch) {
    const [year, month, day] = dateOnlyMatch.slice(1).map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));

    return date.getUTCFullYear() === year &&
      date.getUTCMonth() === month - 1 &&
      date.getUTCDate() === day
      ? value
      : null;
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) || !value.includes("T")
    ? null
    : date.toISOString();
};
