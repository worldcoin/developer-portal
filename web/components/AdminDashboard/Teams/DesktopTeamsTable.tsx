"use client";

import type {
  Cell,
  Header,
  Row,
  Table as TableInstance,
} from "@tanstack/react-table";
import { flexRender } from "@tanstack/react-table";
import clsx from "clsx";
import { ArrowDown, ArrowUp } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { KeyboardEvent, ReactNode } from "react";

import {
  SORTABLE_TEAM_COLUMN_IDS,
  getEffectiveTeamsSort,
  getNextTeamsSort,
  serializeTeamsSort,
  type TeamsSort,
  type TeamsSortField,
} from "./sorting";
import {
  clampColumnSize,
  getColumnMaxSize,
  getColumnMinSize,
  getPinnedColumnStyle,
  getResizeHandleClassName,
  isLastLeftPinnedColumn,
  isNumericColumn,
  isRowHeaderColumn,
} from "./table-utils";
import type { TeamTableRow } from "./types";

type DesktopTeamsTableProps = {
  sort: TeamsSort | null;
  table: TableInstance<TeamTableRow>;
  rows: Row<TeamTableRow>[];
};

type DesktopHeaderCellProps = {
  header: Header<TeamTableRow, unknown>;
  sort: TeamsSort | null;
};

type ResizeHandleProps = {
  header: Header<TeamTableRow, unknown>;
};

type DesktopBodyCellProps = {
  cell: Cell<TeamTableRow, unknown>;
};

const SORTABLE_TEAM_COLUMN_IDS_SET = new Set<string>(SORTABLE_TEAM_COLUMN_IDS);

export const DesktopTeamsTable = ({
  rows,
  sort,
  table,
}: DesktopTeamsTableProps) => {
  return (
    <div
      aria-label="Scrollable teams table"
      className="no-scrollbar hidden size-full min-w-0 overflow-auto overscroll-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 lg:block"
      role="region"
      tabIndex={0}
    >
      <table
        style={{ width: table.getTotalSize(), minWidth: "100%" }}
        className="table-fixed border-separate border-spacing-0 text-left text-14"
      >
        <caption className="sr-only">
          Teams table with status, member count, app count, pending invites,
          active API keys, and creation date.
        </caption>
        <thead className="text-12 font-medium uppercase tracking-wide text-grey-400">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <DesktopHeaderCell
                  key={header.id}
                  header={header}
                  sort={sort}
                />
              ))}
            </tr>
          ))}
        </thead>

        <tbody className="text-grey-700 [&_tr:hover>*]:!bg-grey-100 [&_tr:nth-child(even)>*]:bg-grey-50 [&_tr:nth-child(odd)>*]:bg-grey-0 [&_tr>*]:transition-colors">
          {rows.map((row) => (
            <tr key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <DesktopBodyCell key={cell.id} cell={cell} />
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const DesktopHeaderCell = ({ header, sort }: DesktopHeaderCellProps) => {
  const headerContent = getHeaderContent(header);
  const isPinned = header.column.getIsPinned();
  const sortField = getHeaderSortField(header);
  const effectiveSort = getEffectiveTeamsSort(sort);
  const isSorted = Boolean(sortField && effectiveSort.field === sortField);
  const ariaSort = getHeaderAriaSort(sortField, effectiveSort);

  return (
    <th
      aria-sort={ariaSort}
      scope="col"
      style={{
        width: header.getSize(),
        ...getPinnedColumnStyle(header.column),
      }}
      className={clsx(
        "group sticky top-0 z-20 border-b border-grey-300 bg-grey-0 p-3",
        isPinned && "z-30",
        isLastLeftPinnedColumn(header.column) && "border-r border-grey-300",
        isNumericColumn(header.column.id) && "text-right",
      )}
    >
      {sortField ? (
        <SortableHeaderButton
          isNumeric={isNumericColumn(header.column.id)}
          isSorted={isSorted}
          sort={sort}
          sortField={sortField}
        >
          {headerContent}
        </SortableHeaderButton>
      ) : (
        headerContent
      )}
      <ResizeHandle header={header} />
    </th>
  );
};

type SortableHeaderButtonProps = {
  children: ReactNode;
  isNumeric: boolean;
  isSorted: boolean;
  sort: TeamsSort | null;
  sortField: TeamsSortField;
};

const SortableHeaderButton = ({
  children,
  isNumeric,
  isSorted,
  sort,
  sortField,
}: SortableHeaderButtonProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const effectiveSort = getEffectiveTeamsSort(sort);
  const nextSort = getNextTeamsSort(sort, sortField);

  const updateSort = () => {
    const params = new URLSearchParams(searchParams.toString());

    if (nextSort) {
      params.set("sort", serializeTeamsSort(nextSort));
    } else {
      params.delete("sort");
    }

    params.delete("page");

    const query = params.toString();

    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
  };

  return (
    <button
      className={clsx(
        "inline-flex max-w-full items-center gap-1.5 rounded-8 text-left outline-none transition-colors hover:text-grey-900 focus-visible:ring-2 focus-visible:ring-blue-500",
        isNumeric && "ml-auto",
        isSorted ? "text-grey-900" : "text-grey-400",
      )}
      onClick={updateSort}
      type="button"
    >
      <span className="min-w-0 truncate">{children}</span>
      <span className="grid size-4 shrink-0 place-items-center">
        {isSorted &&
          (effectiveSort.direction === "asc" ? (
            <ArrowUp className="size-3.5" />
          ) : (
            <ArrowDown className="size-3.5" />
          ))}
      </span>
    </button>
  );
};

const DesktopBodyCell = ({ cell }: DesktopBodyCellProps) => {
  const isPinned = cell.column.getIsPinned();
  const cellContent = flexRender(cell.column.columnDef.cell, cell.getContext());
  const cellStyle = {
    width: cell.column.getSize(),
    ...getPinnedColumnStyle(cell.column),
  };
  const cellClassName = clsx(
    "px-3 py-4 align-top font-normal",
    isPinned && "z-10",
    isLastLeftPinnedColumn(cell.column) && "border-r border-grey-300",
    isNumericColumn(cell.column.id) && "text-right",
  );

  if (isRowHeaderColumn(cell.column.id)) {
    return (
      <th className={cellClassName} scope="row" style={cellStyle}>
        {cellContent}
      </th>
    );
  }

  return (
    <td className={cellClassName} style={cellStyle}>
      {cellContent}
    </td>
  );
};

const ResizeHandle = ({ header }: ResizeHandleProps) => {
  if (!header.column.getCanResize()) {
    return null;
  }

  const instructionsId = `${header.id}-resize-instructions`;

  return (
    <>
      <div
        role="separator"
        aria-describedby={instructionsId}
        aria-orientation="vertical"
        aria-label={`Resize ${getHeaderLabel(header)} column`}
        aria-valuemax={getColumnMaxSize(header.column)}
        aria-valuemin={getColumnMinSize(header.column)}
        aria-valuenow={header.getSize()}
        aria-valuetext={`${header.getSize()} pixels`}
        onMouseDown={header.getResizeHandler()}
        onTouchStart={header.getResizeHandler()}
        onKeyDown={(event) => handleResizeKeyDown(event, header)}
        onDoubleClick={() => header.column.resetSize()}
        tabIndex={0}
        className={clsx(
          "absolute right-0 top-0 h-full w-1 cursor-col-resize touch-none select-none focus-visible:w-2 focus-visible:bg-blue-500 focus-visible:outline-none",
          getResizeHandleClassName(header.column.getIsResizing()),
        )}
      />
      <span className="sr-only" id={instructionsId}>
        Use arrow keys to resize. Hold Shift for larger steps. Press Home or End
        for minimum or maximum width. Press Enter or Space to reset.
      </span>
    </>
  );
};

const getHeaderContent = (header: Header<TeamTableRow, unknown>) => {
  if (header.isPlaceholder) {
    return null;
  }

  return flexRender(header.column.columnDef.header, header.getContext());
};

const getHeaderSortField = (header: Header<TeamTableRow, unknown>) => {
  if (header.isPlaceholder) {
    return null;
  }

  if (!SORTABLE_TEAM_COLUMN_IDS_SET.has(header.column.id)) {
    return null;
  }

  return header.column.id as TeamsSortField;
};

const getHeaderAriaSort = (
  sortField: TeamsSortField | null,
  effectiveSort: TeamsSort,
) => {
  if (!sortField || sortField !== effectiveSort.field) {
    return undefined;
  }

  return effectiveSort.direction === "asc" ? "ascending" : "descending";
};

const getHeaderLabel = (header: Header<TeamTableRow, unknown>) => {
  const headerDefinition = header.column.columnDef.header;

  if (typeof headerDefinition === "string") {
    return headerDefinition;
  }

  return header.column.id;
};

const handleResizeKeyDown = (
  event: KeyboardEvent<HTMLDivElement>,
  header: Header<TeamTableRow, unknown>,
) => {
  if (event.key === "ArrowLeft") {
    resizeColumnByKeyboard(event, header, -8);
    return;
  }

  if (event.key === "ArrowDown") {
    resizeColumnByKeyboard(event, header, -8);
    return;
  }

  if (event.key === "ArrowRight") {
    resizeColumnByKeyboard(event, header, 8);
    return;
  }

  if (event.key === "ArrowUp") {
    resizeColumnByKeyboard(event, header, 8);
    return;
  }

  if (event.key === "Home") {
    setColumnSizeFromKeyboard(event, header, getColumnMinSize(header.column));
    return;
  }

  if (event.key === "End") {
    setColumnSizeFromKeyboard(event, header, getColumnMaxSize(header.column));
    return;
  }

  if (event.key === "Enter") {
    resetColumnSizeFromKeyboard(event, header);
    return;
  }

  if (event.key === " ") {
    resetColumnSizeFromKeyboard(event, header);
  }
};

const resizeColumnByKeyboard = (
  event: KeyboardEvent<HTMLDivElement>,
  header: Header<TeamTableRow, unknown>,
  delta: number,
) => {
  let resizeDelta = delta;

  if (event.shiftKey) {
    resizeDelta = delta * 3;
  }

  const nextSize = clampColumnSize(
    header.column,
    header.getSize() + resizeDelta,
  );

  setColumnSizeFromKeyboard(event, header, nextSize);
};

const setColumnSizeFromKeyboard = (
  event: KeyboardEvent<HTMLDivElement>,
  header: Header<TeamTableRow, unknown>,
  size: number,
) => {
  event.preventDefault();
  event.stopPropagation();

  header.getContext().table.setColumnSizing((columnSizing) => {
    return {
      ...columnSizing,
      [header.column.id]: size,
    };
  });
};

const resetColumnSizeFromKeyboard = (
  event: KeyboardEvent<HTMLDivElement>,
  header: Header<TeamTableRow, unknown>,
) => {
  event.preventDefault();
  event.stopPropagation();

  header.column.resetSize();
};
