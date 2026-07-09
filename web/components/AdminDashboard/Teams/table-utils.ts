import type { Column } from "@tanstack/react-table";
import type { CSSProperties } from "react";

import type { TeamTableRow } from "./types";

const numericColumnIds = new Set<string>([
  "membersCount",
  "appsCount",
  "pendingInvitesCount",
  "activeApiKeysCount",
]);

export const getPinnedColumnStyle = (
  column: Column<TeamTableRow, unknown>,
): CSSProperties => {
  if (!column.getIsPinned()) {
    return {};
  }

  return {
    position: "sticky",
    left: column.getStart("left"),
  };
};

export const isLastLeftPinnedColumn = (
  column: Column<TeamTableRow, unknown>,
) => {
  if (column.getIsPinned() !== "left") {
    return false;
  }

  return column.getIsLastColumn("left");
};

export const isNumericColumn = (columnId: string) => {
  return numericColumnIds.has(columnId);
};

export const isRowHeaderColumn = (columnId: string) => {
  return columnId === "name";
};

export const getResizeHandleClassName = (isResizing: boolean) => {
  if (isResizing) {
    return "bg-blue-500";
  }

  return "bg-transparent group-hover:bg-grey-300";
};

export const getColumnMinSize = (column: Column<TeamTableRow, unknown>) => {
  if (typeof column.columnDef.minSize === "number") {
    return column.columnDef.minSize;
  }

  return 40;
};

export const getColumnMaxSize = (column: Column<TeamTableRow, unknown>) => {
  if (typeof column.columnDef.maxSize === "number") {
    return column.columnDef.maxSize;
  }

  return 800;
};

export const clampColumnSize = (
  column: Column<TeamTableRow, unknown>,
  size: number,
) => {
  const minSize = getColumnMinSize(column);
  const maxSize = getColumnMaxSize(column);

  if (size < minSize) {
    return minSize;
  }

  if (size > maxSize) {
    return maxSize;
  }

  return size;
};
