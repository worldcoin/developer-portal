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
  clampColumnSize,
  getColumnMaxSize,
  getColumnMinSize,
  getPinnedColumnStyle,
  getResizeHandleClassName,
  isLastLeftPinnedColumn,
} from "./table-utils";
import type { TableSort } from "./types";

type DesktopAdminTableProps<RowData, SortField extends string> = {
  ariaLabel: string;
  caption: string;
  getEffectiveSort: (sort: TableSort<SortField> | null) => TableSort<SortField>;
  getNextSort: (
    sort: TableSort<SortField> | null,
    field: SortField,
  ) => TableSort<SortField> | null;
  isNumericColumn: (columnId: string) => boolean;
  isRowHeaderColumn: (columnId: string) => boolean;
  rows: Row<RowData>[];
  serializeSort: (sort: TableSort<SortField>) => string;
  sort: TableSort<SortField> | null;
  sortableColumnIds: readonly SortField[];
  table: TableInstance<RowData>;
};

export const DesktopAdminTable = <RowData, SortField extends string>({
  ariaLabel,
  caption,
  getEffectiveSort,
  getNextSort,
  isNumericColumn,
  isRowHeaderColumn,
  rows,
  serializeSort,
  sort,
  sortableColumnIds,
  table,
}: DesktopAdminTableProps<RowData, SortField>) => {
  const sortableColumnIdsSet = new Set<string>(sortableColumnIds);

  return (
    <div
      aria-label={ariaLabel}
      className="no-scrollbar hidden size-full min-w-0 overflow-auto overscroll-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none lg:block"
      role="region"
      tabIndex={0}
    >
      <table
        className="table-fixed border-separate border-spacing-0 text-left text-14"
        style={{ minWidth: "100%", width: table.getTotalSize() }}
      >
        <caption className="sr-only">{caption}</caption>
        <thead className="text-12 font-medium tracking-wide text-grey-400 uppercase">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <DesktopHeaderCell
                  getEffectiveSort={getEffectiveSort}
                  getNextSort={getNextSort}
                  isNumericColumn={isNumericColumn}
                  key={header.id}
                  serializeSort={serializeSort}
                  sort={sort}
                  sortableColumnIds={sortableColumnIdsSet}
                  header={header}
                />
              ))}
            </tr>
          ))}
        </thead>
        <tbody className="text-grey-700 [&_tr:hover>*]:!bg-grey-100 [&_tr:nth-child(even)>*]:bg-grey-50 [&_tr:nth-child(odd)>*]:bg-grey-0 [&_tr>*]:transition-colors">
          {rows.map((row) => (
            <tr key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <DesktopBodyCell
                  cell={cell}
                  isNumericColumn={isNumericColumn}
                  isRowHeaderColumn={isRowHeaderColumn}
                  key={cell.id}
                />
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

type DesktopHeaderCellProps<RowData, SortField extends string> = Omit<
  DesktopAdminTableProps<RowData, SortField>,
  | "ariaLabel"
  | "caption"
  | "isRowHeaderColumn"
  | "rows"
  | "sortableColumnIds"
  | "table"
> & {
  header: Header<RowData, unknown>;
  sortableColumnIds: Set<string>;
};

const DesktopHeaderCell = <RowData, SortField extends string>({
  getEffectiveSort,
  getNextSort,
  header,
  isNumericColumn,
  serializeSort,
  sort,
  sortableColumnIds,
}: DesktopHeaderCellProps<RowData, SortField>) => {
  const headerContent = header.isPlaceholder
    ? null
    : flexRender(header.column.columnDef.header, header.getContext());
  const sortField = sortableColumnIds.has(header.column.id)
    ? (header.column.id as SortField)
    : null;
  const effectiveSort = getEffectiveSort(sort);
  const isSorted = Boolean(sortField && effectiveSort.field === sortField);

  return (
    <th
      aria-sort={
        sortField && effectiveSort.field === sortField
          ? effectiveSort.direction === "asc"
            ? "ascending"
            : "descending"
          : undefined
      }
      className={clsx(
        "group sticky top-0 z-20 border-b border-grey-300 bg-grey-0 p-3",
        header.column.getIsPinned() && "z-30",
        isLastLeftPinnedColumn(header.column) && "border-r border-grey-300",
        isNumericColumn(header.column.id) && "text-right",
      )}
      scope="col"
      style={{
        ...getPinnedColumnStyle(header.column),
        width: header.getSize(),
      }}
    >
      {sortField ? (
        <SortableHeaderButton
          getEffectiveSort={getEffectiveSort}
          getNextSort={getNextSort}
          isNumeric={isNumericColumn(header.column.id)}
          isSorted={isSorted}
          serializeSort={serializeSort}
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

type SortableHeaderButtonProps<SortField extends string> = {
  children: ReactNode;
  getEffectiveSort: (sort: TableSort<SortField> | null) => TableSort<SortField>;
  getNextSort: (
    sort: TableSort<SortField> | null,
    field: SortField,
  ) => TableSort<SortField> | null;
  isNumeric: boolean;
  isSorted: boolean;
  serializeSort: (sort: TableSort<SortField>) => string;
  sort: TableSort<SortField> | null;
  sortField: SortField;
};

const SortableHeaderButton = <SortField extends string>({
  children,
  getEffectiveSort,
  getNextSort,
  isNumeric,
  isSorted,
  serializeSort,
  sort,
  sortField,
}: SortableHeaderButtonProps<SortField>) => {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const effectiveSort = getEffectiveSort(sort);

  const updateSort = () => {
    const params = new URLSearchParams(searchParams.toString());
    const nextSort = getNextSort(sort, sortField);

    if (nextSort) {
      params.set("sort", serializeSort(nextSort));
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
        "inline-flex max-w-full items-center gap-1.5 rounded-8 text-left transition-colors outline-none hover:text-grey-900 focus-visible:ring-2 focus-visible:ring-blue-500",
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

type DesktopBodyCellProps<RowData> = {
  cell: Cell<RowData, unknown>;
  isNumericColumn: (columnId: string) => boolean;
  isRowHeaderColumn: (columnId: string) => boolean;
};

const DesktopBodyCell = <RowData,>({
  cell,
  isNumericColumn,
  isRowHeaderColumn,
}: DesktopBodyCellProps<RowData>) => {
  const className = clsx(
    "px-3 py-4 align-top font-normal",
    cell.column.getIsPinned() && "z-10",
    isLastLeftPinnedColumn(cell.column) && "border-r border-grey-300",
    isNumericColumn(cell.column.id) && "text-right",
  );
  const content = flexRender(cell.column.columnDef.cell, cell.getContext());
  const style = {
    ...getPinnedColumnStyle(cell.column),
    width: cell.column.getSize(),
  };

  return isRowHeaderColumn(cell.column.id) ? (
    <th className={className} scope="row" style={style}>
      {content}
    </th>
  ) : (
    <td className={className} style={style}>
      {content}
    </td>
  );
};

const ResizeHandle = <RowData,>({
  header,
}: {
  header: Header<RowData, unknown>;
}) => {
  if (!header.column.getCanResize()) {
    return null;
  }

  const instructionsId = `${header.id}-resize-instructions`;
  const resize = (event: KeyboardEvent<HTMLDivElement>, delta: number) => {
    event.preventDefault();
    event.stopPropagation();
    const multiplier = event.shiftKey ? 3 : 1;
    header.getContext().table.setColumnSizing((columnSizing) => ({
      ...columnSizing,
      [header.column.id]: clampColumnSize(
        header.column,
        header.getSize() + delta * multiplier,
      ),
    }));
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
      resize(event, -8);
    } else if (event.key === "ArrowRight" || event.key === "ArrowUp") {
      resize(event, 8);
    } else if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      event.stopPropagation();
      header.getContext().table.setColumnSizing((columnSizing) => ({
        ...columnSizing,
        [header.column.id]:
          event.key === "Home"
            ? getColumnMinSize(header.column)
            : getColumnMaxSize(header.column),
      }));
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      event.stopPropagation();
      header.column.resetSize();
    }
  };

  return (
    <>
      <div
        aria-describedby={instructionsId}
        aria-label={`Resize ${getHeaderLabel(header)} column`}
        aria-orientation="vertical"
        aria-valuemax={getColumnMaxSize(header.column)}
        aria-valuemin={getColumnMinSize(header.column)}
        aria-valuenow={header.getSize()}
        aria-valuetext={`${header.getSize()} pixels`}
        className={clsx(
          "absolute top-0 right-0 h-full w-1 cursor-col-resize touch-none select-none focus-visible:w-2 focus-visible:bg-blue-500 focus-visible:outline-none",
          getResizeHandleClassName(header.column.getIsResizing()),
        )}
        onDoubleClick={() => header.column.resetSize()}
        onKeyDown={onKeyDown}
        onMouseDown={header.getResizeHandler()}
        onTouchStart={header.getResizeHandler()}
        role="separator"
        tabIndex={0}
      />
      <span className="sr-only" id={instructionsId}>
        Use arrow keys to resize. Hold Shift for larger steps. Press Home or End
        for minimum or maximum width. Press Enter or Space to reset.
      </span>
    </>
  );
};

const getHeaderLabel = <RowData,>(header: Header<RowData, unknown>) =>
  typeof header.column.columnDef.header === "string"
    ? header.column.columnDef.header
    : header.column.id;
