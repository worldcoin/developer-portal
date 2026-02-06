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
import { useCallback, useState } from "react";
import { FieldError } from "react-hook-form";
import { twMerge } from "tailwind-merge";

const VerificationOptions = [
  "Unlimited",
  "Unique",
  "2 Verifications",
  "3 Verifications",
];

export const MaxVerificationsSelector = (props: {
  value: number;
  onChange: (value: number) => void;
  className?: string;
  showCustomInput?: boolean;
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
    showCustomInput,
    className,
    required,
    disabled,
  } = props;
  const [input, setInput] = useState("");

  const parentClassNames = clsx(
    "rounded-lg border-[1px] bg-grey-0 text-sm text-grey-700 hover:text-grey-700",
    {
      "border-grey-200 focus-within:border-blue-500 focus-within:hover:border-blue-500 hover:border-grey-700 ":
        !errors,
      "border-system-error-500 text-system-error-500 ": errors,
    },
  );
  const selectorClassNames = clsx(
    "peer h-full bg-transparent py-1.5 focus:outline-none focus:ring-0",
    {
      "placeholder:text-grey-400": !errors,
      "group-hover:placeholder:text-grey-700 group-hover:focus:placeholder:text-blue-400 ":
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

  const handleSelect = useCallback(
    (newValue: number) => {
      onChange(newValue);
    },
    [onChange],
  );

  const submitInput = useCallback(() => {
    handleSelect(Number(input));
    setInput("");
  }, [handleSelect, input]);

  return (
    <Select
      value={value}
      onChange={disabled ? () => {} : handleSelect}
      by={(a: number | null, b: number | null) => a === b}
      disabled={disabled}
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
              disabled && "cursor-not-allowed opacity-50",
            )}
            data-testid="select-max-verifications"
            disabled={disabled}
          >
            <Typography variant={TYPOGRAPHY.R4}>
              {VerificationOptions[value] ?? value.toString()}
            </Typography>
            <CaretIcon className="ml-2 text-grey-400 group-hover:text-grey-700" />
          </SelectButton>

          <SelectOptions
            className={clsx(
              "mt-3 max-h-36 text-sm focus:outline-none focus:ring-0",
            )}
          >
            {VerificationOptions.map((option, index) => (
              <SelectOption key={index} value={index}>
                <div className="grid grid-cols-1fr/auto">
                  <Typography variant={TYPOGRAPHY.R4}>
                    {VerificationOptions[index]}
                  </Typography>
                </div>
              </SelectOption>
            ))}
            {showCustomInput && (
              <SelectOption key={"text-input"} value={input}>
                <input
                  className={clsx(
                    "h-11 w-full rounded-lg border border-grey-200 px-1 text-sm placeholder:text-grey-400",
                  )}
                  type="number"
                  value={input}
                  min={4}
                  placeholder="Custom Verification Limit"
                  onChange={(e) => {
                    setInput(e.target.value);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      submitInput();
                    }
                  }}
                />
              </SelectOption>
            )}
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
