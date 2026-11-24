"use client";

import { getCoreRowModel, useReactTable } from "@tanstack/react-table";
import Link from "next/link";

import { DesktopAdminTable } from "../common/DesktopAdminTable";
import { EmptyState } from "../common/EmptyState";
import { MobileAdminList } from "../common/MobileAdminList";
import { columns } from "./columns";
import { RpModeBadge, RpStatusBadge } from "./StatusBadge";
import {
  getEffectiveRpsSort,
  getNextRpsSort,
  serializeRpsSort,
  SORTABLE_RP_COLUMN_IDS,
} from "./sorting";
import type { RpsTableProps } from "./types";

export type { RpTableRow } from "./types";

export const RpsTable = ({ columnVisibility, data, sort }: RpsTableProps) => {
  const table = useReactTable({
    data,
    columns,
    defaultColumn: { size: 150, minSize: 80, maxSize: 400 },
    columnResizeMode: "onChange",
    enableColumnResizing: true,
    initialState: { columnPinning: { left: ["rpId"] } },
    state: { columnVisibility },
    getCoreRowModel: getCoreRowModel(),
  });

  const rows = table.getRowModel().rows;

  if (rows.length === 0) {
    return <EmptyState>No RPs found</EmptyState>;
  }

  return (
    <>
      <MobileAdminList
        data={data}
        renderCard={(rp) => (
          <article
            className="min-w-0 overflow-hidden rounded-16 border border-grey-100 bg-grey-0 p-3 shadow-sm min-[360px]:p-4"
            key={rp.rpId}
          >
            <Link
              className="group block min-w-0 rounded-8 outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              href={`/admin/rps/${rp.rpId}`}
              rel="noreferrer"
              target="_blank"
            >
              <div className="truncate font-mono text-14 font-medium text-grey-900 group-hover:text-blue-500">
                {rp.rpId}
              </div>
              <div className="mt-1 truncate text-13 text-grey-500">
                {rp.appName}
              </div>
            </Link>
            <dl className="mt-3 grid gap-2 text-14 min-[360px]:mt-4">
              <dt className="text-12 font-medium tracking-wide text-grey-400 uppercase">
                Mode
              </dt>
              <dd>
                <RpModeBadge mode={rp.mode} />
              </dd>
              <dt className="text-12 font-medium tracking-wide text-grey-400 uppercase">
                Production status
              </dt>
              <dd>
                <RpStatusBadge status={rp.status} />
              </dd>
              {columnVisibility.stagingStatus && (
                <>
                  <dt className="text-12 font-medium tracking-wide text-grey-400 uppercase">
                    Staging status
                  </dt>
                  <dd>
                    <RpStatusBadge status={rp.stagingStatus} />
                  </dd>
                </>
              )}
              {columnVisibility.teamId && rp.teamId && (
                <>
                  <dt className="text-12 font-medium tracking-wide text-grey-400 uppercase">
                    Team ID
                  </dt>
                  <dd className="truncate font-mono text-12 text-grey-700">
                    {rp.teamId}
                  </dd>
                </>
              )}
              {columnVisibility.signerAddress && (
                <>
                  <dt className="text-12 font-medium tracking-wide text-grey-400 uppercase">
                    Signer
                  </dt>
                  <dd
                    className="truncate font-mono text-12 text-grey-700"
                    title={rp.signerAddress ?? undefined}
                  >
                    {rp.signerAddress ?? "—"}
                  </dd>
                </>
              )}
              {columnVisibility.operationHash && (
                <>
                  <dt className="text-12 font-medium tracking-wide text-grey-400 uppercase">
                    Operation hash
                  </dt>
                  <dd
                    className="truncate font-mono text-12 text-grey-700"
                    title={rp.operationHash ?? undefined}
                  >
                    {rp.operationHash ?? "—"}
                  </dd>
                </>
              )}
              {columnVisibility.stagingOperationHash && (
                <>
                  <dt className="text-12 font-medium tracking-wide text-grey-400 uppercase">
                    Staging operation hash
                  </dt>
                  <dd
                    className="truncate font-mono text-12 text-grey-700"
                    title={rp.stagingOperationHash ?? undefined}
                  >
                    {rp.stagingOperationHash ?? "—"}
                  </dd>
                </>
              )}
              {columnVisibility.updatedAt && rp.updatedAt && (
                <>
                  <dt className="text-12 font-medium tracking-wide text-grey-400 uppercase">
                    Updated
                  </dt>
                  <dd className="text-grey-700">{rp.updatedAt}</dd>
                </>
              )}
              {columnVisibility.createdAt && rp.createdAt && (
                <>
                  <dt className="text-12 font-medium tracking-wide text-grey-400 uppercase">
                    Created
                  </dt>
                  <dd className="text-grey-700">{rp.createdAt}</dd>
                </>
              )}
            </dl>
          </article>
        )}
      />
      <DesktopAdminTable
        ariaLabel="Scrollable RPs table"
        caption="RPs table with mode, production status, staging status, and timestamps."
        getEffectiveSort={getEffectiveRpsSort}
        getNextSort={getNextRpsSort}
        isNumericColumn={() => false}
        isRowHeaderColumn={(columnId) => columnId === "rpId"}
        rows={rows}
        serializeSort={serializeRpsSort}
        sort={sort}
        sortableColumnIds={SORTABLE_RP_COLUMN_IDS}
        table={table}
      />
    </>
  );
};
