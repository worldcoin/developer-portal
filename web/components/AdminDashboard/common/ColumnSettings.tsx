"use client";

import clsx from "clsx";
import { Check, Settings } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { CSSProperties } from "react";
import { useId, useRef } from "react";

import type { ColumnOption } from "./types";

type AnchorStyle = CSSProperties & {
  anchorName?: string;
  positionAnchor?: string;
};

type ColumnSettingsProps<ColumnId extends string> = {
  columnOptions: readonly ColumnOption<ColumnId>[];
  columnVisibility: Record<ColumnId, boolean>;
  serializeColumnVisibility: (visibility: Record<ColumnId, boolean>) => string;
};

export const ColumnSettings = <ColumnId extends string>({
  columnOptions,
  columnVisibility,
  serializeColumnVisibility,
}: ColumnSettingsProps<ColumnId>) => {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const popoverRef = useRef<HTMLDivElement>(null);
  const id = useId().replaceAll(":", "");
  const labelId = `${id}-column-settings-label`;
  const popoverId = `${id}-column-settings-popover`;
  const anchorName = `--${id}-column-settings-anchor`;

  const updateColumnVisibility = (columnId: ColumnId) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set(
      "columns",
      serializeColumnVisibility({
        ...columnVisibility,
        [columnId]: !columnVisibility[columnId],
      }),
    );
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
  };

  return (
    <div className="flex items-center gap-2">
      <button
        aria-controls={popoverId}
        aria-haspopup="menu"
        aria-label="Choose visible columns"
        className="grid size-9 place-items-center rounded-12 border border-grey-200 bg-grey-0 text-grey-500 transition-colors outline-none hover:bg-grey-100 hover:text-grey-900 focus-visible:ring-2 focus-visible:ring-blue-500"
        popoverTarget={popoverId}
        style={{ anchorName } as AnchorStyle}
        type="button"
      >
        <Settings className="size-4" />
      </button>
      <div
        className="fixed inset-auto [top:anchor(bottom)] [left:anchor(left)] m-0 mt-1 min-w-48 rounded-12 border border-grey-200 bg-grey-0 p-1 shadow-lg backdrop:bg-transparent"
        id={popoverId}
        popover="auto"
        ref={popoverRef}
        style={{ positionAnchor: anchorName } as AnchorStyle}
      >
        <div aria-labelledby={labelId} className="grid gap-0.5" role="menu">
          <div
            className="px-2.5 py-2 text-12 font-medium tracking-wide text-grey-400 uppercase"
            id={labelId}
          >
            Visible columns
          </div>
          {columnOptions.map((column) => {
            const isChecked = columnVisibility[column.id];
            const isDisabled = Boolean(column.isRequired);

            return (
              <button
                aria-checked={isChecked}
                className={clsx(
                  "grid grid-cols-[1rem_1fr] items-center gap-2 rounded-8 px-2.5 py-2 text-left text-14 transition-colors outline-none hover:bg-grey-100 focus-visible:ring-2 focus-visible:ring-blue-500",
                  isDisabled && "cursor-not-allowed opacity-50",
                  isChecked ? "text-grey-900" : "text-grey-500",
                )}
                disabled={isDisabled}
                key={column.id}
                onClick={() => updateColumnVisibility(column.id)}
                role="menuitemcheckbox"
                type="button"
              >
                <span
                  className={clsx(
                    "grid size-4 place-items-center rounded border",
                    isChecked
                      ? "border-grey-700 bg-grey-700 text-grey-0"
                      : "border-grey-300 bg-grey-0",
                  )}
                >
                  {isChecked && <Check className="size-3" />}
                </span>
                {column.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
