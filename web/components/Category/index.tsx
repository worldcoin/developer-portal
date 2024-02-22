import { CaretIcon } from "@/components/Icons/CaretIcon";
import {
  Select,
  SelectButton,
  SelectOption,
  SelectOptions,
} from "@/components/Select";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import clsx from "clsx";
import { useCallback } from "react";
import { FieldError } from "react-hook-form";
import { twMerge } from "tailwind-merge";

const Categories = [
  "Social",
  "Gaming",
  "Business",
  "Finance",
  "Productivity",
  "Other",
];

export const CategorySelector = (props: {
  value?: string;
  onChange: (value: string) => void;
  className?: string;
  errors?: FieldError;
  label: string;
  helperText?: string;
  required?: boolean;
  disabled: boolean;
}) => {
  const {
    value,
    onChange,
    errors,
    label,
    helperText,
    className,
    required,
    disabled,
  } = props;

  const parentClassNames = clsx(
    "rounded-lg border-[1px] bg-grey-0 text-sm text-grey-700",
    {
      "border-grey-200 focus-within:border-blue-500 focus-within:hover:border-blue-500 hover:border-grey-700 ":
        !errors && !disabled,
      "border-system-error-500 text-system-error-500 ": errors && !disabled,
      "hover:text-grey-700": !disabled,
      "bg-grey-50 text-grey-400 border-grey-200": disabled,
    },
  );
  const selectorClassNames = clsx(
    "peer h-full bg-transparent py-1.5 focus:outline-none focus:ring-0",
    {
      "text-grey-400": !errors && !value,
      "group-hover:placeholder:text-grey-700 group-hover:focus:placeholder:text-blue-400 ":
        !disabled,
    },
  );
  const labelClassNames = clsx("ml-4 px-0.5 peer-focus:text-blue-500", {
    "text-grey-400 peer-focus:text-blue-500 group-hover:text-grey-700":
      !errors && !disabled,
    "text-system-error-500 peer-focus:text-system-error-500":
      errors && !disabled,
    "text-grey-400": disabled,
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
      disabled={disabled}
      by={(a: number | null, b: number | null) => a === b}
    >
      <div className={"inline-grid font-gta"}>
        <fieldset
          className={twMerge(clsx("group grid w-full pb-2", parentClassNames))}
        >
          <SelectButton
            className={clsx(
              "text-left",
              selectorClassNames,
              "grid grid-cols-1fr/auto",
              className,
            )}
          >
            <Typography variant={TYPOGRAPHY.R0}>
              {value === "" ? "Select a category" : value}
            </Typography>
            <CaretIcon
              className={clsx("ml-2 text-grey-400", {
                "group-hover:text-grey-700": !disabled,
              })}
            />
          </SelectButton>

          <SelectOptions
            className={clsx(
              "mt-3 max-h-40 text-sm focus:outline-none focus:ring-0",
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
            <Typography variant={TYPOGRAPHY.R4}>{label}</Typography>{" "}
            {required && <span className="text-system-error-500">*</span>}
          </legend>
        </fieldset>
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
    </Select>
  );
};
