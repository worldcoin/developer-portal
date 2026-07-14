"use client";

import { Button } from "@/components/Button";
import { CaretIcon } from "@/components/Icons/CaretIcon";
import { formatNullifierHex } from "@/lib/format-nullifier";
import { relativeTimeShort } from "@/lib/relative-time-short";

type NullifierRow = {
  id: string;
  created_at: string;
  nullifier: string;
};

export const VerificationsFeed = (props: {
  nullifiers: NullifierRow[];
  page: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
  onPreviousPage: () => void;
  onNextPage: () => void;
}) => {
  const {
    nullifiers,
    page,
    hasPreviousPage,
    hasNextPage,
    onPreviousPage,
    onNextPage,
  } = props;

  return (
    <div className="flex flex-col overflow-hidden rounded-16 border border-portal-border bg-white shadow-portal-card">
      <div className="flex items-center gap-2 border-b border-portal-border px-4 py-3">
        <span className="font-world text-sm font-medium text-portal-heading">
          Verifications
        </span>
      </div>

      {nullifiers.length === 0 ? (
        <div className="px-4 py-12 text-center font-world text-13 text-portal-muted">
          No verifications yet.
        </div>
      ) : (
        <div className="flex flex-col">
          {nullifiers.map((nullifier) => (
            <div
              key={nullifier.id}
              className="flex items-center gap-3 border-b border-portal-border px-4 py-3"
            >
              <span className="font-ibm text-13 text-portal-ink">
                {formatNullifierHex(nullifier.nullifier)}
              </span>
              <span className="flex-1" />
              <span className="font-world text-12 whitespace-nowrap text-portal-subtle">
                {relativeTimeShort(nullifier.created_at)}
              </span>
            </div>
          ))}
        </div>
      )}

      {hasPreviousPage || hasNextPage ? (
        <div className="flex items-center justify-end gap-4 px-4 py-4">
          <Button
            type="button"
            onClick={onPreviousPage}
            disabled={!hasPreviousPage}
            className="group flex size-8 cursor-pointer items-center justify-center rounded-lg border border-grey-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <CaretIcon className="size-4 rotate-90 text-grey-400 group-hover:text-grey-700" />
          </Button>
          <div className="flex size-8 items-center justify-center rounded-lg border border-grey-200 text-center text-xs text-grey-900">
            {page}
          </div>
          <Button
            type="button"
            onClick={onNextPage}
            disabled={!hasNextPage}
            className="group flex size-8 cursor-pointer items-center justify-center rounded-lg border border-grey-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <CaretIcon className="size-4 -rotate-90 text-grey-400 group-hover:text-grey-700" />
          </Button>
        </div>
      ) : null}
    </div>
  );
};
