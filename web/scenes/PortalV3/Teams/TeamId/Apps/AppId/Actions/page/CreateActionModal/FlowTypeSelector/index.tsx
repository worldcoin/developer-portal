"use client";
import { CaretIcon } from "@/components/Icons/CaretIcon";
import {
  Select,
  SelectButton,
  SelectOption,
  SelectOptions,
} from "@/components/Select";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import clsx from "clsx";
import { FieldError } from "react-hook-form";
import { twMerge } from "tailwind-merge";

export const FlowTypeSelector = (props: {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  errors?: FieldError;
  label: string;
  helperText?: string;
  required?: boolean;
  disabled?: boolean;
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
      "border-grey-200 focus-within:border-blue-500 focus-within:hover:border-blue-500 hover:border-grey-700":
        !errors && !disabled,
      "border-system-error-500 text-system-error-500": errors,
      "border-grey-200 text-grey-400 hover:text-grey-400": disabled,
    },
  );

  const selectorClassNames = clsx(
    "peer h-full bg-transparent py-1.5 focus:outline-none focus:ring-0",
    {
      "placeholder:text-grey-400": !errors,
      "group-hover:placeholder:text-grey-700 group-hover:focus:placeholder:text-blue-400":
        true,
    },
  );

  const labelClassNames = clsx(
    "ml-4 whitespace-nowrap px-[2px] peer-focus:text-blue-500",
    {
      "text-grey-400 peer-focus:text-blue-500 group-hover:text-grey-700":
        !errors,
      "text-system-error-500 peer-focus:text-system-error-500": errors,
    },
  );

  const flowOptions = [
    { value: "VERIFY", label: "Verify" },
    { value: "PARTNER", label: "Partner" },
  ];

  return (
    <Select value={value} onChange={onChange} disabled={disabled}>
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
              { "cursor-not-allowed": disabled },
            )}
            data-testid="select-flow-type"
          >
            <Typography variant={TYPOGRAPHY.R4}>
              {flowOptions.find((option) => option.value === value)?.label ??
                value}
            </Typography>
            {!disabled && (
              <CaretIcon className="ml-2 text-grey-400 group-hover:text-grey-700" />
            )}
          </SelectButton>

          <SelectOptions
            className={clsx(
              "mt-3 max-h-36 text-sm focus:outline-none focus:ring-0",
            )}
          >
            {flowOptions.map((option) => (
              <SelectOption key={option.value} value={option.value}>
                <div className="grid grid-cols-1fr/auto">
                  <Typography variant={TYPOGRAPHY.R4}>
                    {option.label}
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
