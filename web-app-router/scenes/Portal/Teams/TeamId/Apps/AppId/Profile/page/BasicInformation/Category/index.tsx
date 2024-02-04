import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { useCallback } from "react";
import { CaretIcon } from "@/components/Icons/CaretIcon";
import {
  Select,
  SelectButton,
  SelectOptions,
  SelectOption,
} from "@/components/Select";
import clsx from "clsx";
import { FieldError } from "react-hook-form";
import { twMerge } from "tailwind-merge";

const Categories = ["Social", "Gaming", "Business", "Finance", "Productivity"];

export const CategorySelector = (props: {
  value?: string;
  onChange: (value: string) => void;
  className?: string;
  errors?: FieldError;
  label: string;
  helperText?: string;
}) => {
  const { value, onChange, errors, label, helperText, className } = props;

  const parentClassNames = clsx(
    "border-[1px] text-grey-700 rounded-lg bg-grey-0  text-sm hover:text-grey-700",
    {
      "border-grey-200 focus-within:border-blue-500 focus-within:hover:border-blue-500 hover:border-grey-700 ":
        !errors,
      "border-system-error-500 text-system-error-500 ": errors,
    },
  );
  const selectorClassNames = clsx(
    "peer focus:outline-none focus:ring-0 bg-transparent py-1.5 h-full",
    {
      "text-grey-400": !errors && !value,
      "group-hover:placeholder:text-grey-700 group-hover:focus:placeholder:text-blue-400 ":
        true,
    },
  );
  const labelClassNames = clsx("ml-2 px-[2px] peer-focus:text-blue-500", {
    "text-grey-400 peer-focus:text-blue-500 group-hover:text-grey-700": !errors,
    "text-system-error-500 peer-focus:text-system-error-500": errors,
  });

  const handleSelect = useCallback(
    (newValue: number) => {
      onChange(Categories[newValue]);
    },
    [onChange],
  );

  return (
    <Select
      value={value ? Categories.indexOf(value) : -1}
      onChange={handleSelect}
      by={(a: number | null, b: number | null) => a === b}
    >
      <div className={"inline-grid font-gta"}>
        <fieldset
          className={twMerge(clsx("grid group pb-2 w-full", parentClassNames))}
        >
          <SelectButton
            className={clsx(
              "text-left",
              selectorClassNames,
              "grid grid-cols-1fr/auto",
              className,
            )}
          >
            <Typography variant={TYPOGRAPHY.R4}>
              {value ?? "Select a category"}
            </Typography>
            <CaretIcon className="ml-2 text-grey-400 group-hover:text-grey-700" />
          </SelectButton>

          <SelectOptions
            className={clsx(
              "mt-3 text-sm focus:ring-0 focus:outline-none max-h-40",
            )}
          >
            {Categories.map((_, index) => (
              <SelectOption
                key={index}
                value={index}
                className="h-full hover:bg-grey-50"
              >
                <div className="grid grid-cols-1fr/auto">
                  <Typography variant={TYPOGRAPHY.R4}>
                    {Categories[index]}
                  </Typography>
                </div>
              </SelectOption>
            ))}
          </SelectOptions>
          <legend className={labelClassNames}>
            <Typography variant={TYPOGRAPHY.R4}>{label}</Typography>
          </legend>
        </fieldset>
        <div className={clsx("flex flex-col w-full px-2")}>
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
    </Select>
  );
};
