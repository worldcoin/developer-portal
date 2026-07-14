"use client";

import { Pagination } from "@/components/Pagination";
import { formatNullifierHex } from "@/lib/format-nullifier";
import { relativeTimeShort } from "@/lib/relative-time-short";

type NullifierRow = {
  id: string;
  created_at: string;
  nullifier: string;
};

export const VerificationsFeed = (props: {
  nullifiers: NullifierRow[];
  total: number;
  page: number;
  rowsPerPage: number;
  onPageChange: (page: number) => void;
}) => {
  const { nullifiers, total, page, rowsPerPage, onPageChange } = props;

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

      {total > 0 ? (
        <Pagination
          totalResults={total}
          currentPage={page}
          rowsPerPage={rowsPerPage}
          handlePageChange={onPageChange}
          className="px-4"
        />
      ) : null}
    </div>
  );
};
