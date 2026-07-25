"use client";

import { Search } from "lucide-react";
import type { CSSProperties, KeyboardEvent } from "react";
import { useCallback, useEffect, useId, useRef, useState } from "react";

import { useAdminSearchParamsPatch } from "./SearchParamsController";
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

export const FieldSearch = ({
  fields,
  getVisualSegments,
  pageParam = "page",
  placeholder,
  queryParam = "query",
  value,
}: FieldSearchProps) => {
  const patchSearchParams = useAdminSearchParamsPatch();
  const [searchValue, setSearchValue] = useState(value);
  const [searchScrollLeft, setSearchScrollLeft] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const committedSearchValueRef = useRef(value);
  const id = useId().replaceAll(":", "");
  const popoverId = `${id}-search-popover`;
  const anchorName = `--${id}-search-anchor`;
  const visualSegments = getVisualSegments(searchValue);

  const syncSearchScrollLeft = useCallback(() => {
    setSearchScrollLeft(inputRef.current?.scrollLeft ?? 0);
  }, []);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(syncSearchScrollLeft);
    return () => window.cancelAnimationFrame(frameId);
  }, [searchValue, syncSearchScrollLeft]);

  useEffect(() => {
    if (document.activeElement !== inputRef.current) {
      committedSearchValueRef.current = value;
      setSearchValue(value);
    }
  }, [value]);

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

  const insertSnippet = (snippet: string) => {
    const input = inputRef.current;
    if (!input) {
      return;
    }

    const selectionStart = input.selectionStart ?? searchValue.length;
    const selectionEnd = input.selectionEnd ?? searchValue.length;
    const prefix = searchValue.slice(0, selectionStart);
    const suffix = searchValue.slice(selectionEnd);
    const needsLeadingSpace = prefix.length > 0 && !prefix.endsWith(" ");
    const needsTrailingSpace = suffix.length > 0 && !suffix.startsWith(" ");
    const nextValue = `${prefix}${needsLeadingSpace ? " " : ""}${snippet}${
      needsTrailingSpace ? " " : ""
    }${suffix}`;
    const nextCursorPosition =
      prefix.length + (needsLeadingSpace ? 1 : 0) + snippet.length;

    setSearchValue(nextValue);
    input.focus();
    window.requestAnimationFrame(() => {
      input.setSelectionRange(nextCursorPosition, nextCursorPosition);
      syncSearchScrollLeft();
    });
  };

  const hideSuggestions = () => {
    window.setTimeout(() => {
      if (document.activeElement !== inputRef.current) {
        popoverRef.current?.hidePopover();
      }
    }, 100);
  };

  const handleSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      event.currentTarget.blur();
      popoverRef.current?.hidePopover();
    }
  };

  return (
    <div
      className="relative h-9 w-full min-w-0"
      style={{ anchorName } as AnchorStyle}
    >
      <Search className="pointer-events-none absolute top-1/2 left-3 z-20 size-4 -translate-y-1/2 text-grey-400" />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-10 flex min-w-0 items-center overflow-hidden rounded-12 border border-grey-200 bg-grey-0 py-0 pr-3 pl-9 text-14 font-medium"
      >
        {searchValue ? (
          <div
            className="flex min-w-max items-center whitespace-pre"
            style={{ transform: `translateX(-${searchScrollLeft}px)` }}
          >
            {visualSegments.map((segment, index) =>
              segment.type === "chip" ? (
                <span
                  className="relative inline-block text-blue-500"
                  key={`chip-${index}`}
                >
                  <span className="absolute -inset-x-0.5 top-1/2 h-5 -translate-y-1/2 rounded bg-blue-50 ring-2 ring-blue-150/60 transition-[background-color,box-shadow] duration-150 ease-out" />
                  <span className="relative z-10">{segment.value}</span>
                </span>
              ) : (
                <span className="text-grey-700" key={`text-${index}`}>
                  {segment.value}
                </span>
              ),
            )}
          </div>
        ) : (
          <span className="text-grey-400">{placeholder}</span>
        )}
      </div>
      <input
        aria-controls={popoverId}
        aria-haspopup="listbox"
        aria-label={placeholder}
        className="relative z-20 size-full rounded-12 border border-transparent bg-transparent py-0 pr-3 pl-9 text-14 font-medium text-transparent caret-grey-900 transition-colors outline-none selection:bg-blue-150/60 placeholder:text-transparent focus-visible:ring-2 focus-visible:ring-blue-500"
        enterKeyHint="search"
        onBlur={hideSuggestions}
        onChange={(event) => setSearchValue(event.target.value)}
        onClick={syncSearchScrollLeft}
        onFocus={() => {
          if (!searchValue) {
            popoverRef.current?.showPopover();
          }
        }}
        onKeyDown={handleSearchKeyDown}
        onKeyUp={syncSearchScrollLeft}
        onScroll={syncSearchScrollLeft}
        onSelect={syncSearchScrollLeft}
        placeholder={placeholder}
        ref={inputRef}
        role="searchbox"
        type="text"
        value={searchValue}
      />
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
