"use client";

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
import { useCallback, useEffect, useMemo, useState } from "react";
import { FieldValues, Path, PathValue } from "react-hook-form";
import { twMerge } from "tailwind-merge";
import { DecoratedButton } from "../DecoratedButton";
import { CaretIcon } from "../Icons/CaretIcon";
import { CheckIcon } from "../Icons/CheckIcon";
import { CloseIcon } from "../Icons/CloseIcon";
import { TYPOGRAPHY, Typography } from "../Typography";

type Item = { label: string; value: string };

export type SelectMultipleProps<T extends FieldValues> = {
  items: Item[];
  values: PathValue<T, Path<T>>;
  onChange: (value: string) => void;
  onRemove: (value: string) => void;
  label: string;
  errors: any;
  disabled: boolean;
  required?: boolean;
  className?: string;
  helperText?: string;
  selectAll?: () => void;
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
    onChange,
    onRemove,
    selectAll,
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
    () => values?.map((value: string) => items.find((i) => i.value === value)),
    [items, values],
  );

  const filteredItems = useMemo(
    () =>
      items.filter(
        (item) =>
          item.label.toLowerCase().includes(search.toLowerCase()) ||
          item.value.toLowerCase().includes(search.toLowerCase()),
      ),
    [items, search],
  );

  const labelClassNames = clsx("ml-2 text-sm peer-focus:text-blue-500", {
    "text-grey-400 peer-focus:text-blue-500 group-hover:text-grey-700":
      !errors && !disabled,
    "text-system-error-500 peer-focus:text-system-error-500":
      errors && !disabled,
    "text-grey-400": disabled,
    "px-0": label == "",
    "px-0.5": label != "",
  });

  const fieldsetClassName = clsx(
    "rounded-lg border bg-grey-0 px-2 text-base text-grey-700 md:text-sm",

    {
      "border-grey-200 focus-within:border-blue-500 focus-within:hover:border-blue-500 hover:border-grey-700":
        !errors && !disabled,
      "border-system-error-500 text-system-error-500 focus-within:border-system-error-500":
        errors && !disabled,
    },

    {
      "hover:text-grey-700": !disabled,
      "bg-grey-50 text-grey-400 border-grey-200": disabled,
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
          "w-full cursor-pointer border px-2 pb-4 pt-2",
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

        <div className="grid w-full grid-cols-1fr/auto items-center px-2">
          {Array.isArray(selectedItems) && selectedItems.length === 0 && (
            <span
              className={twMerge(
                clsx("select-none text-grey-400", {
                  "text-system-error-500": errors,
                }),
              )}
            >
              Select options
            </span>
          )}

          {Array.isArray(inputVisibleItems) && inputVisibleItems.length > 0 && (
            <div className="grid gap-y-2">
              <div className="flex flex-wrap gap-2">
                {inputVisibleItems.map((item, index) => (
                  <div
                    key={`select-multiple-option-${item.label}-${index}`}
                    className="grid grid-cols-1fr/auto items-center overflow-hidden rounded-lg"
                  >
                    <Typography
                      variant={TYPOGRAPHY.R4}
                      className="select-none border-r border-grey-0 bg-grey-900 px-2 py-1 text-grey-0"
                    >
                      {item.label}
                    </Typography>

                    <button
                      type="button"
                      className="size-full cursor-pointer bg-grey-900 p-1 transition-colors hover:bg-grey-900/80"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemove(item.value);
                      }}
                    >
                      <CloseIcon strokeWidth={2} className="text-grey-0" />
                    </button>
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

          <CaretIcon className="ml-2 text-grey-400 group-hover:text-grey-700" />
        </div>
      </fieldset>

      <div
        ref={refs.setFloating}
        style={floatingStyles}
        className={clsx(
          "z-50 grid min-h-0 w-full grid-rows-auto/1fr gap-y-2 rounded-xl border border-grey-200 bg-white py-2 shadow-lg",
          { hidden: !open },
        )}
        {...getFloatingProps()}
      >
        <div
          className={clsx("grid gap-y-2", {
            "order-1": placement === "top",
            "order-0": placement !== "top",
          })}
        >
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={twMerge(
              clsx("mx-2 p-2", fieldsetClassName, {
                "border-grey-200 text-grey-700 focus-within:border-blue-500 hover:border-grey-700 focus-within:hover:border-blue-500":
                  errors,
              }),
            )}
          />

          {selectAll && (
            <DecoratedButton
              type="button"
              variant="primary"
              className="mx-2"
              onClick={selectAll}
            >
              {selectedItems.length > 0 ? "Remove all" : "Select all"}
            </DecoratedButton>
          )}
        </div>

        <div className={clsx("min-h-0 overflow-y-auto")}>
          {filteredItems.map((item, index) => (
            <label
              key={`select-multiple-${item.value}-${index}`}
              className="grid cursor-pointer grid-cols-auto/1fr items-center gap-x-2 px-2 py-1 hover:bg-grey-50"
            >
              <div
                className={twMerge(
                  clsx(
                    "relative size-6 rounded-md",
                    { "opacity-50": disabled },
                    className,
                  ),
                )}
              >
                <input
                  type="checkbox"
                  className="peer hidden"
                  value={item.value}
                  checked={values.includes(item.value)}
                  onChange={() => {
                    onChange(item.value);
                  }}
                />
                <div className="pointer-events-none absolute inset-0 z-10 size-full rounded-md shadow-[0px_0px_0px_1px_inset] shadow-grey-300 transition-colors peer-checked:shadow-grey-100/20" />

                <div className="invisible absolute inset-0 flex cursor-pointer items-center justify-center rounded-md bg-grey-900 opacity-0 transition-[visibility,opacity] peer-checked:visible peer-checked:opacity-100">
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-grey-0/10 to-transparent" />
                  <CheckIcon size="16" className="text-grey-0" />
                </div>
              </div>

              <Typography variant={TYPOGRAPHY.R4} className="select-none">
                {item.label}
              </Typography>
            </label>
          ))}
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
    </div>
  );
};
