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
    "rounded-lg border bg-surface text-sm text-content-strong hover:text-content-strong",
    {
      "border-edge focus-within:border-focus focus-within:hover:border-focus hover:border-edge-heavy ":
        !errors,
      "border-edge-error-500 text-content-error-500 ": errors,
    },
  );
  const selectorClassNames = clsx(
    "peer h-full bg-transparent py-1.5 focus:outline-hidden focus:ring-0",
    {
      "placeholder:text-content-tertiary": !errors,
      "group-hover:placeholder:text-content-strong focus:group-hover:placeholder:text-blue-400 ":
        true,
    },
  );
  const labelClassNames = clsx(
    "ml-4 whitespace-nowrap px-[2px] peer-focus:text-content-link-legacy",
    {
      "text-content-tertiary peer-focus:text-content-link-legacy group-hover:text-content-strong":
        !errors,
      "text-content-error-500 peer-focus:text-content-error-500": errors,
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
          >
            <Typography variant={TYPOGRAPHY.R4}>
              {VerificationOptions[value] ?? value.toString()}
            </Typography>
            <CaretIcon className="ml-2 text-content-tertiary group-hover:text-content-strong" />
          </SelectButton>

          <SelectOptions
            className={clsx(
              "mt-3 max-h-36 text-sm focus:ring-0 focus:outline-hidden",
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
                    "h-11 w-full rounded-lg border border-edge px-1 text-sm placeholder:text-content-tertiary",
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
            {required && <span className="text-content-error-500">*</span>}
          </legend>
        </fieldset>
        <div className={clsx("flex w-full flex-col px-2")}>
          {helperText && (
            <Typography
              variant={TYPOGRAPHY.R5}
              className="mt-2 text-content-secondary"
            >
              {helperText}
            </Typography>
          )}
          {errors?.message && (
            <Typography
              className="mt-2 text-content-error-500"
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
