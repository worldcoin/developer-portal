"use client";

import { Search, X } from "lucide-react";
import type { CSSProperties, KeyboardEvent } from "react";
import { useEffect, useId, useMemo, useRef, useState } from "react";

import { useAdminSearchParamsPatch } from "./SearchParamsController";
import { tokenizeSearchQuery } from "./search-tokens";
import type { SearchField, SearchVisualSegment } from "./types";

type AnchorStyle = CSSProperties & {
  anchorName?: string;
  positionAnchor?: string;
};

type FieldSearchProps = {
  fields: readonly SearchField[];
  getVisualSegments: (query: string) => SearchVisualSegment[];
  pageParam?: string;
  placeholder: string;
  queryParam?: string;
  value: string;
};

const FIELD_VALUE_PATTERN = /^([A-Za-z_][A-Za-z0-9_]*)(>=|<=|!=|:|=|>|<)(.*)$/;

const hasBalancedFieldQuotes = (token: string) => {
  const match = token.match(FIELD_VALUE_PATTERN);
  if (!match) {
    return true;
  }

  const value = match[3];
  if (!value.startsWith('"') && !value.startsWith("'")) {
    return true;
  }

  const quote = value[0];
  return value.length >= 2 && value.endsWith(quote) && value !== quote;
};

const isCommitableChipToken = (
  token: string,
  getVisualSegments: (query: string) => SearchVisualSegment[],
) => {
  if (!hasBalancedFieldQuotes(token)) {
    return false;
  }

  const segments = getVisualSegments(token);
  return (
    segments.length === 1 &&
    segments[0]?.type === "chip" &&
    segments[0].value === token
  );
};

const serializeQuery = (chips: readonly string[], draft: string) =>
  [...chips, draft.trim()].filter(Boolean).join(" ");

const parseExternalValue = (
  query: string,
  getVisualSegments: (query: string) => SearchVisualSegment[],
) => {
  const segments = getVisualSegments(query);
  const chips = segments
    .filter(
      (segment): segment is Extract<SearchVisualSegment, { type: "chip" }> =>
        segment.type === "chip",
    )
    .map((segment) => segment.value);
  const draft = segments
    .filter((segment) => segment.type === "text")
    .map((segment) => segment.value)
    .join("")
    .replace(/\s+/g, " ")
    .trim();

  return { chips, draft };
};

const extractChipsFromDraft = (
  draft: string,
  getVisualSegments: (query: string) => SearchVisualSegment[],
  onlyWhenTrailingSpace: boolean,
) => {
  if (onlyWhenTrailingSpace && !/\s$/.test(draft)) {
    return { committed: [] as string[], remaining: draft };
  }

  const tokens = tokenizeSearchQuery(draft);
  const committed: string[] = [];
  const remaining: string[] = [];

  for (const token of tokens) {
    if (isCommitableChipToken(token, getVisualSegments)) {
      committed.push(token);
    } else {
      remaining.push(token);
    }
  }

  return {
    committed,
    remaining: remaining.join(" "),
  };
};

const ChipLabel = ({ value }: { value: string }) => {
  const separator = value.match(/>=|<=|!=|:|=|>|</)?.[0];

  if (!separator) {
    return <span>{value}</span>;
  }

  const separatorIndex = value.indexOf(separator);
  const field = value.slice(0, separatorIndex);
  const rest = value.slice(separatorIndex + separator.length);

  return (
    <span>
      <span>{field}</span>
      <span className="text-blue-500">{separator}</span>
      <span>{rest}</span>
    </span>
  );
};

export const FieldSearch = ({
  fields,
  getVisualSegments,
  pageParam = "page",
  placeholder,
  queryParam = "query",
  value,
}: FieldSearchProps) => {
  const patchSearchParams = useAdminSearchParamsPatch();
  const [chips, setChips] = useState(
    () => parseExternalValue(value, getVisualSegments).chips,
  );
  const [draft, setDraft] = useState(
    () => parseExternalValue(value, getVisualSegments).draft,
  );
  const inputRef = useRef<HTMLInputElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const committedSearchValueRef = useRef(value);
  const id = useId().replaceAll(":", "");
  const popoverId = `${id}-search-popover`;
  const anchorName = `--${id}-search-anchor`;
  const searchValue = useMemo(
    () => serializeQuery(chips, draft),
    [chips, draft],
  );

  useEffect(() => {
    if (document.activeElement !== inputRef.current) {
      committedSearchValueRef.current = value;
      const parsed = parseExternalValue(value, getVisualSegments);
      setChips(parsed.chips);
      setDraft(parsed.draft);
    }
  }, [getVisualSegments, value]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const nextValue = searchValue.trim();

      if (nextValue === committedSearchValueRef.current) {
        return;
      }

      committedSearchValueRef.current = nextValue;
      patchSearchParams({
        [pageParam]: null,
        [queryParam]: nextValue || null,
      });
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [pageParam, patchSearchParams, queryParam, searchValue]);

  useEffect(() => {
    if (searchValue) {
      popoverRef.current?.hidePopover();
    }
  }, [searchValue]);

  const focusDraftAtEnd = (nextDraft: string = draft) => {
    window.requestAnimationFrame(() => {
      const input = inputRef.current;
      if (!input) {
        return;
      }

      input.focus();
      const cursor = nextDraft.length;
      input.setSelectionRange(cursor, cursor);
    });
  };

  const insertSnippet = (snippet: string) => {
    const nextDraft = draft
      ? `${draft}${draft.endsWith(" ") ? "" : " "}${snippet}`
      : snippet;

    setDraft(nextDraft);
    focusDraftAtEnd(nextDraft);
  };

  const removeChip = (chipIndex: number) => {
    setChips((current) => current.filter((_, index) => index !== chipIndex));
    inputRef.current?.focus();
  };

  const handleDraftChange = (nextDraft: string) => {
    const { committed, remaining } = extractChipsFromDraft(
      nextDraft,
      getVisualSegments,
      true,
    );

    if (committed.length > 0) {
      setChips((current) => [...current, ...committed]);
      setDraft(remaining);
      return;
    }

    setDraft(nextDraft);
  };

  const hideSuggestions = () => {
    window.setTimeout(() => {
      if (document.activeElement !== inputRef.current) {
        popoverRef.current?.hidePopover();
      }
    }, 100);
  };

  const handleBlur = () => {
    hideSuggestions();

    const { committed, remaining } = extractChipsFromDraft(
      draft,
      getVisualSegments,
      false,
    );

    if (committed.length > 0) {
      setChips((current) => [...current, ...committed]);
      setDraft(remaining);
    }
  };

  const handleSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      event.currentTarget.blur();
      popoverRef.current?.hidePopover();
      return;
    }

    if (
      event.key === "Backspace" &&
      draft.length === 0 &&
      chips.length > 0 &&
      (event.currentTarget.selectionStart ?? 0) === 0
    ) {
      event.preventDefault();
      removeChip(chips.length - 1);
    }
  };

  const showPlaceholder = chips.length === 0 && draft.length === 0;

  return (
    <div
      className="relative w-full min-w-0"
      style={{ anchorName } as AnchorStyle}
    >
      <div
        className="flex min-h-9 min-w-0 cursor-text flex-wrap items-center gap-1.5 rounded-12 border border-grey-200 bg-grey-0 py-1 pr-2 pl-9 focus-within:ring-2 focus-within:ring-blue-500"
        onClick={() => inputRef.current?.focus()}
      >
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-grey-400" />

        {chips.map((chip, chipIndex) => (
          <span
            className="inline-flex max-w-full items-center gap-1 rounded-8 bg-blue-50 py-0.5 pr-1 pl-1.5 font-mono text-12 text-grey-900 ring-1 ring-blue-150/80"
            key={`${chip}-${chipIndex}`}
          >
            <span className="min-w-0 truncate">
              <ChipLabel value={chip} />
            </span>
            <button
              aria-label={`Remove ${chip}`}
              className="inline-flex size-4 shrink-0 items-center justify-center rounded text-grey-500 transition-colors hover:bg-blue-150 hover:text-grey-900 focus-visible:ring-2 focus-visible:ring-blue-500"
              onClick={(event) => {
                event.stopPropagation();
                removeChip(chipIndex);
              }}
              onMouseDown={(event) => event.preventDefault()}
              type="button"
            >
              <X className="size-3" strokeWidth={2.5} />
            </button>
          </span>
        ))}

        <input
          aria-controls={popoverId}
          aria-haspopup="listbox"
          aria-label={placeholder}
          className="min-w-32 flex-1 bg-transparent py-0.5 text-14 text-grey-900 caret-grey-900 outline-none placeholder:text-grey-400"
          enterKeyHint="search"
          onBlur={handleBlur}
          onChange={(event) => handleDraftChange(event.target.value)}
          onFocus={() => {
            if (!searchValue) {
              popoverRef.current?.showPopover();
            }
          }}
          onKeyDown={handleSearchKeyDown}
          placeholder={showPlaceholder ? placeholder : undefined}
          ref={inputRef}
          role="searchbox"
          type="text"
          value={draft}
        />
      </div>

      <div
        className="fixed inset-auto top-[anchor(bottom)] left-[anchor(left)] m-0 mt-1 max-h-[min(24rem,calc(100dvh-anchor(bottom)-0.75rem))] w-80 max-w-[calc(100vw-1.5rem)] overflow-x-hidden overflow-y-auto rounded-12 border border-grey-200 bg-grey-0 p-1 shadow-lg backdrop:bg-transparent"
        id={popoverId}
        popover="manual"
        ref={popoverRef}
        role="listbox"
        style={{ positionAnchor: anchorName } as AnchorStyle}
      >
        <div className="grid gap-0.5">
          <div className="px-2.5 py-2 text-12 font-medium tracking-wide text-grey-400 uppercase">
            Search fields
          </div>
          {fields.map((field) => {
            const snippet =
              field.type === "string" ? `${field.field}:` : `${field.field}>=`;
            const examples = field.examples.join(" · ");

            return (
              <button
                aria-selected={false}
                className="grid w-full min-w-0 grid-cols-[minmax(0,11rem)_minmax(0,1fr)] items-center gap-3 rounded-8 px-2.5 py-2 text-left transition-colors outline-none hover:bg-grey-100 focus-visible:ring-2 focus-visible:ring-blue-500"
                key={field.field}
                onClick={() => insertSnippet(snippet)}
                onMouseDown={(event) => event.preventDefault()}
                role="option"
                type="button"
              >
                <span
                  className="truncate font-mono text-12 font-medium text-grey-900"
                  title={field.field}
                >
                  {field.field}
                </span>
                <span
                  className="min-w-0 truncate text-12 text-grey-500"
                  title={examples}
                >
                  {examples}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
