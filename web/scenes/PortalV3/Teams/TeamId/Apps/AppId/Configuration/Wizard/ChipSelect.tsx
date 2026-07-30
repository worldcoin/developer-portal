"use client";

import { Icon } from "@/scenes/PortalV3/common/Icon";
import clsx from "clsx";
import { useEffect, useRef, useState } from "react";

export type ChipSelectItem = {
  value: string;
  label: string;
  /** ISO country code used to render the flag from `public/icons/flags`. */
  flagCode?: string;
};

/**
 * Search input + selected chips, as on the Availability step. Typing filters
 * the option list in a dropdown (the dropdown itself has no Figma frame —
 * styled to match the wizard's boxes); picked values render as removable
 * pills with their flag below the input.
 */
export const ChipSelect = (props: {
  placeholder: string;
  items: ChipSelectItem[];
  values: string[];
  onChange: (values: string[]) => void;
  /** Values that render without a remove affordance (e.g. default locale). */
  lockedValues?: string[];
  disabled?: boolean;
  error?: string;
  /** "Add all …" affordance, mirroring the previous SelectMultiple. */
  selectAllLabel?: string;
  onSelectAll?: () => void;
  /** "Clear all" affordance; the caller owns any confirmation dialog. */
  onClearAll?: () => void;
  canClearAll?: boolean;
}) => {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [opensUpward, setOpensUpward] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // The wizard's content is a clipping scroll region, so a dropdown opening
  // downward near its bottom edge would be cut off. Flip upward when the
  // space below the input (inside the nearest scroll container) can't fit
  // the panel — the previous page's SelectMultiple did the same via
  // floating-ui.
  useEffect(() => {
    if (!isOpen) return;
    const el = containerRef.current;
    if (!el) return;
    let parent = el.parentElement;
    while (
      parent &&
      !/(auto|scroll)/.test(getComputedStyle(parent).overflowY)
    ) {
      parent = parent.parentElement;
    }
    const boundBottom = parent
      ? parent.getBoundingClientRect().bottom
      : window.innerHeight;
    // max-h-64 panel + mt-2 gap + a little slack.
    setOpensUpward(boundBottom - el.getBoundingClientRect().bottom < 280);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [isOpen]);

  const normalizedQuery = query.trim().toLowerCase();
  const filteredItems = props.items.filter((item) =>
    item.label.toLowerCase().includes(normalizedQuery),
  );
  const selectedItems = props.values
    .map((value) => props.items.find((item) => item.value === value))
    .filter((item): item is ChipSelectItem => Boolean(item));

  const toggle = (value: string) => {
    if (props.disabled) return;
    if (props.values.includes(value)) {
      if (props.lockedValues?.includes(value)) return;
      props.onChange(props.values.filter((v) => v !== value));
    } else {
      props.onChange([...props.values, value]);
    }
  };

  return (
    <div className="flex w-full flex-col gap-4">
      <div ref={containerRef} className="relative w-full">
        <div
          className={clsx(
            "flex h-14 w-full items-center gap-2 rounded-[10px] p-4",
            props.error
              ? "border border-[#ea392a] bg-system-error-50"
              : "bg-portal-canvas",
            props.disabled && "opacity-60",
          )}
        >
          <input
            type="text"
            role="combobox"
            aria-expanded={isOpen}
            value={query}
            placeholder={props.placeholder}
            disabled={props.disabled}
            onFocus={() => setIsOpen(true)}
            onChange={(event) => {
              setQuery(event.target.value);
              setIsOpen(true);
            }}
            onKeyDown={(event) => {
              if (event.key === "Escape") setIsOpen(false);
            }}
            className="w-full min-w-0 bg-transparent text-15 leading-[1.3] font-[350] text-portal-ink outline-none placeholder:text-portal-subtle"
          />
        </div>

        {isOpen && !props.disabled && filteredItems.length > 0 && (
          <ul
            role="listbox"
            className={clsx(
              "absolute z-10 max-h-64 w-full overflow-y-auto rounded-[10px] border border-portal-border bg-white p-1 shadow-portal-card",
              opensUpward ? "bottom-full mb-2" : "top-full mt-2",
            )}
          >
            {filteredItems.map((item) => {
              const isSelected = props.values.includes(item.value);
              return (
                <li key={item.value}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => toggle(item.value)}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-15 leading-[1.3] font-[350] text-portal-ink hover:bg-portal-canvas"
                  >
                    {item.flagCode && (
                      <img
                        src={`/icons/flags/${item.flagCode}.svg`}
                        alt=""
                        width={20}
                        height={20}
                        className="size-5 shrink-0"
                      />
                    )}
                    <span className="min-w-0 flex-1 truncate">
                      {item.label}
                    </span>
                    {isSelected && (
                      <Icon name="dropdown-check" className="size-4 shrink-0" />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {props.error && (
        <p className="text-13 leading-[1.3] font-[350] text-[#ea392a]">
          {props.error}
        </p>
      )}

      {!props.disabled && (props.onSelectAll || props.onClearAll) && (
        <div className="flex items-center gap-4">
          {props.onSelectAll && (
            <button
              type="button"
              onClick={props.onSelectAll}
              className="text-13 leading-[1.2] font-semibold text-portal-ink underline-offset-2 hover:underline"
            >
              {props.selectAllLabel ?? "Add all"}
            </button>
          )}
          {props.onClearAll && props.canClearAll !== false && (
            <button
              type="button"
              onClick={props.onClearAll}
              // Figma nucleus/foreground-secondary (#7d7d7d) — no portal token.
              className="text-13 leading-[1.2] font-semibold text-[#7d7d7d] underline-offset-2 hover:underline"
            >
              Clear all
            </button>
          )}
        </div>
      )}

      {selectedItems.length > 0 && (
        <div className="flex flex-wrap items-start gap-2">
          {selectedItems.map((item) => {
            const isLocked = props.lockedValues?.includes(item.value);
            return (
              <span
                key={item.value}
                className="flex h-8 items-center justify-center gap-1 rounded-2xl bg-portal-canvas py-1.5 pr-3.5 pl-1.5"
              >
                {item.flagCode && (
                  <img
                    src={`/icons/flags/${item.flagCode}.svg`}
                    alt=""
                    width={20}
                    height={20}
                    className="size-5 shrink-0"
                  />
                )}
                <span className="text-13 leading-[1.2] font-semibold whitespace-nowrap text-portal-ink">
                  {item.label}
                </span>
                {!isLocked && !props.disabled && (
                  <button
                    type="button"
                    aria-label={`Remove ${item.label}`}
                    onClick={() => toggle(item.value)}
                    className="shrink-0"
                  >
                    <Icon name="xmark" className="size-4" />
                  </button>
                )}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
};
