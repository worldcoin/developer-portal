"use client";

import { TYPOGRAPHY, Typography } from "@/components/Typography";
import clsx from "clsx";
import Skeleton from "react-loading-skeleton";

/**
 * Structural skeletons: they mirror the shape of the content that replaces
 * them (labels above fields, bordered cards, table rows) instead of stamping
 * out featureless blocks, so the layout doesn't jump when data lands.
 */

/** Label line above a field-height block. */
export const SkeletonField = (props: {
  labelWidth?: number | string;
  height?: number;
  className?: string;
}) => (
  <div className={clsx("grid gap-y-2", props.className)}>
    <Skeleton width={props.labelWidth ?? 120} height={12} />
    <Skeleton height={props.height ?? 44} className="rounded-lg" />
  </div>
);

/** Stack of labelled fields, as a settings form renders. */
export const SkeletonForm = (props: {
  count?: number;
  className?: string;
  fieldHeight?: number;
}) => (
  <div className={clsx("grid gap-y-6", props.className)}>
    {Array.from({ length: props.count ?? 3 }).map((_, index) => (
      <SkeletonField
        key={index}
        height={props.fieldHeight}
        labelWidth={index % 2 === 0 ? 120 : 160}
      />
    ))}
  </div>
);

/** Bordered card shell with a title line and body lines. */
export const SkeletonCard = (props: {
  lines?: number;
  className?: string;
  children?: React.ReactNode;
}) => (
  <div
    aria-hidden
    className={clsx(
      "flex min-h-[144px] flex-col gap-2 rounded-[10px] border border-portal-border bg-white p-5",
      props.className,
    )}
  >
    {props.children ?? (
      <>
        <Skeleton width="60%" height={14} />
        {Array.from({ length: props.lines ?? 2 }).map((_, index) => (
          <Skeleton key={index} width={index % 2 === 0 ? "90%" : "70%"} />
        ))}
      </>
    )}
  </div>
);

/** Real column headers over skeleton cells, as a data table renders. */
export const SkeletonTable = (props: {
  columns: string[];
  rows?: number;
  className?: string;
}) => (
  <div
    className={clsx("grid w-full gap-x-4", props.className)}
    style={{
      gridTemplateColumns: `repeat(${props.columns.length}, minmax(0, 1fr))`,
    }}
  >
    {props.columns.map((column) => (
      <div key={column} className="border-b border-grey-200 py-3">
        <Typography variant={TYPOGRAPHY.R5} as="div" className="text-grey-400">
          {column}
        </Typography>
      </div>
    ))}

    {Array.from({ length: props.rows ?? 4 }).map((_, row) =>
      props.columns.map((column, columnIndex) => (
        <div key={`${row}-${column}`} className="py-4">
          <Skeleton width={columnIndex === 0 ? "70%" : "50%"} height={12} />
        </div>
      )),
    )}
  </div>
);
