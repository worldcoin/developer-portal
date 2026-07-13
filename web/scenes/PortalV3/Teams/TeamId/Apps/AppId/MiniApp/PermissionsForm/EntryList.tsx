"use client";

import { CopyButton } from "@/components/CopyButton";
import { CaretIcon } from "@/components/Icons/CaretIcon";
import { CloseIcon } from "@/components/Icons/CloseIcon";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import clsx from "clsx";
import { useState } from "react";

type EntryListProps = {
  values: string[];
  onChange: (next: string[]) => void;
  placeholder: string;
  disabled: boolean;
  validate: (value: string) => boolean;
  invalidMessage: string;
  duplicateMessage: string;
  copyFieldName: string;
  formatDisplay?: (value: string) => string;
  /** Applied to each entry before validation/storage (e.g. prepend https://). */
  normalize?: (value: string) => string;
  /** Omit to render nothing when the list is empty. */
  emptyText?: string;
  allowCommaSeparated?: boolean;
  /** Number of entries shown before the inline disclosure. */
  maxVisibleRows?: number;
};

const REVEAL_BATCH_SIZE = 10;

type EntryRowProps = {
  value: string;
  disabled: boolean;
  copyFieldName: string;
  formatDisplay: (value: string) => string;
  onRemove: () => void;
  testId: string;
};

const EntryRow = (props: EntryRowProps) => {
  const { value, disabled, copyFieldName, formatDisplay, onRemove, testId } =
    props;

  return (
    <div
      className="flex h-11 items-center gap-x-3 rounded-xl border border-grey-100 bg-grey-0 pl-4 pr-2"
      data-testid={testId}
    >
      <span
        className="min-w-0 flex-1 truncate font-world text-[15px] text-grey-900"
        title={value}
      >
        {formatDisplay(value)}
      </span>

      <CopyButton
        fieldName={copyFieldName}
        fieldValue={value}
        className="rounded-lg p-2 !pr-2 hover:bg-grey-100"
        iconClassName="size-4 text-grey-500"
      />

      {!disabled && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${value}`}
          className="flex size-8 shrink-0 items-center justify-center rounded-lg text-grey-500 hover:bg-grey-100 hover:text-grey-900"
        >
          <CloseIcon className="size-3.5" strokeWidth={1.5} />
        </button>
      )}
    </div>
  );
};

export const EntryList = (props: EntryListProps) => {
  const {
    values,
    onChange,
    placeholder,
    disabled,
    validate,
    invalidMessage,
    duplicateMessage,
    copyFieldName,
    formatDisplay = (value) => value,
    normalize = (value) => value,
    emptyText,
    allowCommaSeparated = false,
    maxVisibleRows = 2,
  } = props;
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [revealedCount, setRevealedCount] = useState(0);

  const visibleRowLimit = Math.max(1, maxVisibleRows);
  const visibleValues = values.slice(0, visibleRowLimit + revealedCount);
  const remainingCount = values.length - visibleValues.length;
  const nextRevealCount = Math.min(REVEAL_BATCH_SIZE, remainingCount);
  const isExpanded = revealedCount > 0 && values.length > visibleRowLimit;

  const remove = (value: string) => {
    const nextValues = values.filter((entry) => entry !== value);
    const nextOverflowCount = Math.max(0, nextValues.length - visibleRowLimit);

    setRevealedCount((count) => Math.min(count, nextOverflowCount));
    onChange(nextValues);
  };

  const add = () => {
    const entries = (allowCommaSeparated ? draft.split(",") : [draft])
      .map((entry) => entry.trim())
      .filter(Boolean)
      .map(normalize);
    if (entries.length === 0) return;

    if (entries.some((entry) => !validate(entry))) {
      setError(invalidMessage);
      return;
    }

    const seen = new Set(values.map((value) => value.toLowerCase()));
    const hasDuplicate = entries.some((entry) => {
      const normalized = entry.toLowerCase();
      if (seen.has(normalized)) return true;
      seen.add(normalized);
      return false;
    });

    if (hasDuplicate) {
      setError(duplicateMessage);
      return;
    }

    onChange([...values, ...entries]);
    setDraft("");
    setError(null);
  };

  return (
    <div className="grid gap-y-2">
      {!disabled && (
        <div className="grid gap-y-1.5">
          <div
            className={clsx(
              "flex h-11 items-center gap-x-3 rounded-xl border bg-grey-0 px-4 transition-colors",
              error
                ? "border-system-error-500"
                : "border-grey-200 focus-within:border-blue-500",
            )}
          >
            <input
              type="text"
              value={draft}
              placeholder={placeholder}
              onChange={(event) => {
                setDraft(event.target.value);
                setError(null);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  add();
                }
              }}
              className="h-full min-w-0 flex-1 bg-transparent font-world text-[15px] text-grey-900 placeholder:text-grey-400 focus:outline-none focus:ring-0"
            />

            <button
              type="button"
              onClick={add}
              disabled={!draft.trim()}
              className="font-world text-[13px] font-semibold text-blue-500 disabled:text-grey-300"
            >
              Add
            </button>
          </div>

          {error && (
            <p className="px-2 font-world text-xs text-system-error-500">
              {error}
            </p>
          )}
        </div>
      )}

      {values.length > 0 ? (
        <div className="grid gap-y-2">
          {visibleValues.map((value) => (
            <EntryRow
              key={value}
              value={value}
              disabled={disabled}
              copyFieldName={copyFieldName}
              formatDisplay={formatDisplay}
              onRemove={() => remove(value)}
              testId="entry-list-visible-row"
            />
          ))}

          {(remainingCount > 0 || isExpanded) && (
            <div className="flex h-11 overflow-hidden rounded-xl border border-grey-100 bg-grey-0 text-grey-700">
              {remainingCount > 0 && (
                <button
                  type="button"
                  onClick={() =>
                    setRevealedCount((count) => count + nextRevealCount)
                  }
                  aria-expanded={isExpanded}
                  aria-label={`Show ${nextRevealCount} more ${copyFieldName.toLowerCase()} entries`}
                  className="flex min-w-0 flex-1 items-center justify-between gap-x-3 px-4 text-left transition-colors hover:bg-grey-50"
                >
                  <span className="font-world text-[14px] font-medium">
                    Show {nextRevealCount} more
                  </span>
                  <CaretIcon className="size-4 shrink-0" />
                </button>
              )}

              {isExpanded && (
                <button
                  type="button"
                  onClick={() => setRevealedCount(0)}
                  aria-expanded="true"
                  aria-label={`Show fewer ${copyFieldName.toLowerCase()} entries`}
                  className={clsx(
                    "flex min-w-0 items-center justify-between gap-x-3 px-4 text-left transition-colors hover:bg-grey-50",
                    remainingCount > 0
                      ? "flex-1 border-l border-grey-100"
                      : "w-full",
                  )}
                >
                  <span className="font-world text-[14px] font-medium">
                    Show less
                  </span>
                  <CaretIcon className="size-4 shrink-0 rotate-180" />
                </button>
              )}
            </div>
          )}
        </div>
      ) : emptyText ? (
        <Typography variant={TYPOGRAPHY.R4} className="px-1 text-grey-400">
          {emptyText}
        </Typography>
      ) : null}
    </div>
  );
};
