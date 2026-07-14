"use client";

import clsx from "clsx";
import { Check, ChevronDown } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { CSSProperties } from "react";
import { useId, useRef } from "react";

type AnchorStyle = CSSProperties & {
  anchorName?: string;
  positionAnchor?: string;
};

type LimitSelectorProps<Limit extends number> = {
  className?: string;
  options: readonly Limit[];
  value: Limit;
};

export const LimitSelector = <Limit extends number>({
  className,
  options,
  value,
}: LimitSelectorProps<Limit>) => {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const popoverRef = useRef<HTMLDivElement>(null);
  const id = useId().replaceAll(":", "");
  const labelId = `${id}-limit-label`;
  const popoverId = `${id}-limit-popover`;
  const anchorName = `--${id}-limit-anchor`;

  const handleSelect = (nextValue: Limit) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("limit", String(nextValue));
    params.delete("page");
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
    popoverRef.current?.hidePopover();
  };

  return (
    <div className={clsx("flex items-center gap-2", className)}>
      <span
        className="text-12 font-medium tracking-wide text-grey-400 uppercase"
        id={labelId}
      >
        Limit
      </span>
      <button
        aria-controls={popoverId}
        aria-haspopup="listbox"
        className="inline-flex h-9 items-center gap-2 rounded-12 border border-grey-200 bg-grey-0 px-3 text-14 font-medium text-grey-900 transition-colors outline-none hover:bg-grey-100 focus-visible:ring-2 focus-visible:ring-blue-500"
        popoverTarget={popoverId}
        style={{ anchorName } as AnchorStyle}
        type="button"
      >
        {value}
        <ChevronDown className="size-4 text-grey-400" />
      </button>
      <div
        className="fixed inset-auto [top:anchor(bottom)] [left:anchor(left)] m-0 mt-1 min-w-28 rounded-12 border border-grey-200 bg-grey-0 p-1 shadow-lg backdrop:bg-transparent"
        id={popoverId}
        popover="auto"
        ref={popoverRef}
        style={{ positionAnchor: anchorName } as AnchorStyle}
      >
        <div aria-labelledby={labelId} className="grid gap-0.5" role="listbox">
          {options.map((option) => (
            <button
              aria-selected={option === value}
              className={clsx(
                "grid grid-cols-[1rem_1fr] items-center gap-2 rounded-8 px-2.5 py-2 text-left text-14 transition-colors outline-none hover:bg-grey-100 focus-visible:ring-2 focus-visible:ring-blue-500",
                option === value ? "text-grey-900" : "text-grey-500",
              )}
              key={option}
              onClick={() => handleSelect(option)}
              role="option"
              type="button"
            >
              <span className="grid size-4 place-items-center">
                {option === value && <Check className="size-3.5" />}
              </span>
              {option}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
