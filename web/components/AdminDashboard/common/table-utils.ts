import type { Column } from "@tanstack/react-table";
import type { CSSProperties } from "react";

export const getPinnedColumnStyle = <Row>(
  column: Column<Row, unknown>,
): CSSProperties => {
  if (!column.getIsPinned()) {
    return {};
  }

  return {
    left: column.getStart("left"),
    position: "sticky",
  };
};

export const isLastLeftPinnedColumn = <Row>(column: Column<Row, unknown>) =>
  column.getIsPinned() === "left" && column.getIsLastColumn("left");

export const getResizeHandleClassName = (isResizing: boolean) =>
  isResizing ? "bg-blue-500" : "bg-transparent group-hover:bg-grey-300";

export const getColumnMinSize = <Row>(column: Column<Row, unknown>) =>
  typeof column.columnDef.minSize === "number" ? column.columnDef.minSize : 40;

export const getColumnMaxSize = <Row>(column: Column<Row, unknown>) =>
  typeof column.columnDef.maxSize === "number" ? column.columnDef.maxSize : 800;

export const clampColumnSize = <Row>(
  column: Column<Row, unknown>,
  size: number,
) =>
  Math.min(Math.max(size, getColumnMinSize(column)), getColumnMaxSize(column));
