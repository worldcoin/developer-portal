"use client";

import { getCoreRowModel, useReactTable } from "@tanstack/react-table";
import Link from "next/link";

import { DesktopAdminTable } from "../common/DesktopAdminTable";
import { EmptyState } from "../common/EmptyState";
import { MobileAdminList } from "../common/MobileAdminList";
import { columns } from "./columns";
import {
  getEffectiveAppsSort,
  getNextAppsSort,
  serializeAppsSort,
  SORTABLE_APP_COLUMN_IDS,
} from "./sorting";
import type { AppsTableProps } from "./types";

export type { AppTableRow } from "./types";

export const AppsTable = ({ columnVisibility, data, sort }: AppsTableProps) => {
  const table = useReactTable({
    data,
    columns,
    defaultColumn: { size: 150, minSize: 80, maxSize: 400 },
    columnResizeMode: "onChange",
    enableColumnResizing: true,
    initialState: { columnPinning: { left: ["name"] } },
    state: { columnVisibility },
    getCoreRowModel: getCoreRowModel(),
  });

  const rows = table.getRowModel().rows;

  if (rows.length === 0) {
    return <EmptyState>No apps found</EmptyState>;
  }

  return (
    <>
      <MobileAdminList
        data={data}
        renderCard={(app) => (
          <article
            className="min-w-0 overflow-hidden rounded-16 border border-grey-100 bg-grey-0 p-3 shadow-sm min-[360px]:p-4"
            key={app.id}
          >
            <Link
              className="group block min-w-0 rounded-8 outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              href={`/admin/apps/${app.id}`}
              rel="noreferrer"
              target="_blank"
            >
              <div className="truncate text-16 font-medium text-grey-900 group-hover:text-blue-500">
                {app.name}
              </div>
              <div className="mt-1 truncate font-mono text-12 text-grey-400">
                {app.id}
              </div>
            </Link>
            <dl className="mt-3 grid gap-2 text-14 min-[360px]:mt-4">
              {columnVisibility.teamId && app.teamId && (
                <>
                  <dt className="text-12 font-medium tracking-wide text-grey-400 uppercase">
                    Team ID
                  </dt>
                  <dd className="truncate font-mono text-12 text-grey-700">
                    {app.teamId}
                  </dd>
                </>
              )}
              {columnVisibility.draftMetadataName && (
                <>
                  <dt className="text-12 font-medium tracking-wide text-grey-400 uppercase">
                    Draft metadata
                  </dt>
                  <dd className="truncate text-grey-700">
                    {app.draftMetadataName ?? "—"}
                  </dd>
                </>
              )}
              {columnVisibility.verifiedMetadataName && (
                <>
                  <dt className="text-12 font-medium tracking-wide text-grey-400 uppercase">
                    Verified metadata
                  </dt>
                  <dd className="truncate text-grey-700">
                    {app.verifiedMetadataName ?? "—"}
                  </dd>
                </>
              )}
              {columnVisibility.createdAt && app.createdAt && (
                <>
                  <dt className="text-12 font-medium tracking-wide text-grey-400 uppercase">
                    Created
                  </dt>
                  <dd className="text-grey-700">{app.createdAt}</dd>
                </>
              )}
            </dl>
          </article>
        )}
      />
      <DesktopAdminTable
        ariaLabel="Scrollable apps table"
        caption="Apps table with team, draft metadata, verified metadata, and creation date."
        getEffectiveSort={getEffectiveAppsSort}
        getNextSort={getNextAppsSort}
        isNumericColumn={() => false}
        isRowHeaderColumn={(columnId) => columnId === "name"}
        rows={rows}
        serializeSort={serializeAppsSort}
        sort={sort}
        sortableColumnIds={SORTABLE_APP_COLUMN_IDS}
        table={table}
      />
    </>
  );
};
