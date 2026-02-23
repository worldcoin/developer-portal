"use client";

import { PlusCircleIcon } from "@/components/Icons/PlusCircleIcon";
import {
  autoUpdate,
  flip,
  offset,
  shift,
  size,
  useDismiss,
  useFloating,
  useInteractions,
} from "@floating-ui/react";
import clsx from "clsx";
import { ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { FieldValues, Path, PathValue } from "react-hook-form";
import { twMerge } from "tailwind-merge";
import { Button } from "../Button";
import { DecoratedButton } from "../DecoratedButton";
import { CheckIcon } from "../Icons/CheckIcon";
import { CloseIcon } from "../Icons/CloseIcon";
import { TYPOGRAPHY, Typography } from "../Typography";

type Item = { label: string; value: string };

export type SelectMultipleProps<T extends FieldValues> = {
  items: Readonly<Item[]> | undefined;
  values: PathValue<T, Path<T>>;
  onRemove: (value: string) => void;
  label: string;
  errors: any;
  disabled: boolean;
  required?: boolean;
  className?: string;
  helperText?: string;
  selectAll?: () => void;
  clearAll?: () => void;
  showSelectedList?: boolean;
  children: (item: Item, index: number) => React.ReactNode;
  searchPlaceholder?: string;
  canClearAll?: boolean;
  canDelete?: (item: Item) => boolean;
  selectAllLabel: string;
  renderBadgeIcon?: (item: Item) => ReactNode;
};

export const SelectMultiple = <T extends FieldValues>(
  props: SelectMultipleProps<T>,
) => {
  const {
    items,
    className,
    label,
    errors,
    disabled,
    required,
    values,
    helperText,
    onRemove,
    selectAll,
    clearAll,
    searchPlaceholder,
    selectAllLabel,
  } = props;

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const { refs, floatingStyles, placement, context, update } = useFloating({
    open,
    onOpenChange: setOpen,
    middleware: [
      offset(4),

      flip({
        fallbackPlacements: ["top"],
        padding: 10,
      }),

      shift({
        padding: 10,
      }),

      size({
        apply({ availableHeight, rects, elements }) {
          const maxHeight = 400;
          const height = Math.min(maxHeight, availableHeight);
          Object.assign(elements.floating.style, {
            maxHeight: `${height}px`,
            width: `${rects.reference.width}px`,
          });
        },

        padding: 10,
        boundary: "clippingAncestors",
      }),
    ],

    whileElementsMounted: autoUpdate,
  });

  const dismiss = useDismiss(context);
  const { getReferenceProps, getFloatingProps } = useInteractions([dismiss]);

  const selectedItems: Item[] = useMemo(
    () => values?.map((value: string) => items?.find((i) => i.value === value)),
    [items, values],
  );

  const filteredItems = useMemo(
    () =>
      items?.filter(
        (item) =>
          item.label.toLowerCase().includes(search.toLowerCase()) ||
          item.value.toLowerCase().includes(search.toLowerCase()),
      ),
    [items, search],
  );

  const labelClassNames = clsx(
    "ml-2 whitespace-nowrap text-sm peer-focus:text-blue-500",
    {
      "text-grey-400 peer-focus:text-blue-500 group-hover:text-grey-700":
        !errors && !disabled,
      "text-system-error-500 peer-focus:text-system-error-500":
        errors && !disabled,
      "text-grey-400": disabled,
      "px-0": label == "",
      "px-0.5": label != "",
    },
  );

  const fieldsetClassName = clsx(
    "overflow-hidden rounded-[10px] border bg-grey-50 text-base text-grey-700 md:text-sm",

    {
      "border-transparent focus-within:border-blue-500 focus-within:hover:border-blue-500 hover:border-grey-300":
        !errors && !disabled,
      "border-system-error-500 text-system-error-500 focus-within:border-system-error-500":
        errors && !disabled,
    },

    {
      "hover:text-grey-700": !disabled,
      "text-grey-400 border-transparent": disabled,
    },
  );

  const toggleOpen = useCallback(() => {
    if (!disabled) {
      setOpen(!open);
    }
  }, [disabled, open]);

  useEffect(() => {
    if (open) {
      update();
    }
  }, [open, update]);

  const MAX_VISIBLE_ITEMS = 10;

  const inputVisibleItems = useMemo(
    () => selectedItems?.slice(0, MAX_VISIBLE_ITEMS),
    [selectedItems],
  );

  const restSelectedCount = useMemo(
    () => selectedItems?.length - MAX_VISIBLE_ITEMS,
    [selectedItems],
  );

  return (
    <div
      className={twMerge(
        clsx(
          "relative w-full content-start gap-y-4 transition-all",
          { "pointer-events-none": disabled },
          className,
        ),
      )}
    >
      <fieldset
        className={clsx(
          "w-full cursor-pointer border px-4 py-3",
          fieldsetClassName,
        )}
        onClick={toggleOpen}
        ref={refs.setReference}
        {...getReferenceProps()}
      >
        {label && (
          <legend className={twMerge(clsx("select-none", labelClassNames))}>
            {label}{" "}
            {required && <span className="text-system-error-500">*</span>}
          </legend>
        )}

        <div className="grid grid-cols-1fr/auto items-center gap-x-2">
          <input
            type="text"
            placeholder={searchPlaceholder ?? "Search..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={twMerge(
              clsx(
                "w-full bg-transparent py-0 pl-0 text-grey-900 outline-none placeholder:text-grey-500",
              ),
            )}
            disabled={disabled}
          />

          {Array.isArray(inputVisibleItems) && inputVisibleItems.length > 0 && (
            <DecoratedButton
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                clearAll?.();
              }}
              className={clsx(
                "hover:bg-grey-800 h-8 rounded-full bg-grey-900 px-3 text-white",
                {
                  "cursor-not-allowed opacity-50": !props.canClearAll,
                },
              )}
              disabled={disabled || !props.canClearAll}
            >
              <Typography variant={TYPOGRAPHY.M4} className="text-white">
                Clear all
              </Typography>
            </DecoratedButton>
          )}
        </div>
      </fieldset>

      <div
        ref={refs.setFloating}
        style={floatingStyles}
        className={clsx(
          "z-50 grid min-h-0 w-full grid-rows-auto/1fr gap-y-1 rounded-xl border border-grey-200 bg-white py-2 shadow-lg",
          { hidden: !open },
        )}
        {...getFloatingProps()}
      >
        {(!search || search.length === 0) && (
          <div
            className={clsx("grid gap-y-2 p-2 hover:bg-grey-50", {
              "order-1": placement === "top",
              "order-0": placement !== "top",
            })}
          >
            {selectAll && (
              <Button
                type="button"
                className="grid grid-cols-auto/1fr items-center justify-items-start gap-x-2"
                onClick={selectAll}
                disabled={disabled}
              >
                <PlusCircleIcon variant="secondary" />

                <Typography variant={TYPOGRAPHY.R3}>
                  {selectAllLabel}
                </Typography>
              </Button>
            )}
          </div>
        )}

        <div className={clsx("grid min-h-0 gap-y-1 overflow-y-auto")}>
          {filteredItems?.map((item, index) => props.children(item, index))}
        </div>
      </div>

      <div className={clsx("flex w-full flex-col px-2")}>
        {helperText && (
          <Typography variant={TYPOGRAPHY.R5} className="mt-2 text-grey-500">
            {helperText}
          </Typography>
        )}

        {errors?.message && (
          <Typography
            className="mt-2 text-system-error-500"
            variant={TYPOGRAPHY.R5}
          >
            {errors.message}
          </Typography>
        )}
      </div>

      {props.showSelectedList && (
        <div className="mt-4">
          {Array.isArray(inputVisibleItems) && inputVisibleItems.length > 0 && (
            <div className="grid gap-y-2">
              <div className="flex flex-wrap gap-2">
                {inputVisibleItems.map((item, index) => (
                  <div
                    key={`select-multiple-option-${item?.label}-${index}`}
                    className="flex h-8 items-center gap-2 rounded-full border border-grey-100 bg-grey-100 pl-1.5 pr-3"
                  >
                    {props.renderBadgeIcon?.(item)}
                    <span className="select-none text-[13px] font-semibold text-grey-900">
                      {item?.label}
                    </span>

                    {(props.canDelete?.(item) ?? true) && (
                      <button
                        type="button"
                        className="cursor-pointer transition-opacity hover:opacity-70 disabled:cursor-not-allowed disabled:opacity-50"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemove(item.value);
                        }}
                        disabled={disabled}
                      >
                        <CloseIcon
                          strokeWidth={2}
                          className="size-4 text-grey-500"
                        />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {restSelectedCount > 0 && (
                <Typography
                  variant={TYPOGRAPHY.R5}
                  className="select-none text-grey-400"
                >
                  +{restSelectedCount} more
                </Typography>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const Item = (props: {
  icon?: ReactNode;
  item: Item;
  index: number;
  checked: boolean | undefined;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
}) => {
  const { icon, item, index, checked, onChange, disabled, className } = props;

  return (
    <label
      key={`select-multiple-${item.value}-${index}`}
      className={clsx(
        "grid cursor-pointer items-center gap-x-2 py-2 pl-2 pr-5 hover:bg-grey-50",
        {
          "grid-cols-1fr/auto": !icon,
          "grid-cols-auto/1fr/auto": icon,
        },
      )}
    >
      {icon ?? null}

      <Typography variant={TYPOGRAPHY.R3} className="select-none">
        {item?.label}
      </Typography>

      <div
        className={twMerge(
          clsx(
            "relative size-[22px] rounded-full",
            { "opacity-50": disabled },
            className,
          ),
        )}
      >
        <input
          type="checkbox"
          className="peer hidden"
          value={item.value}
          checked={checked}
          onChange={() => onChange(item.value)}
          disabled={disabled}
        />

        <div className="invisible absolute inset-0 flex cursor-pointer items-center justify-center rounded-full bg-grey-900 opacity-0 transition-[visibility,opacity] peer-checked:visible peer-checked:opacity-100">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-grey-0/10 to-transparent" />
          <CheckIcon size="16" className="text-grey-0" />
        </div>
      </div>
    </label>
  );
};

SelectMultiple.Item = Item;
