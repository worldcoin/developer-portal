"use client";
import { ArrowRightIcon } from "@/components/Icons/ArrowRightIcon";
import { CaretIcon } from "@/components/Icons/CaretIcon";
import {
  Select,
  SelectButton,
  SelectOptions,
  SelectOption,
} from "@/components/Select";
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
}) => {
  const {
    value,
    onChange,
    errors,
    label,
    helperText,
    showCustomInput,
    className,
  } = props;
  const [input, setInput] = useState("");

  const parentClassNames = clsx(
    "border-[1px] text-grey-700 rounded-lg bg-grey-0  text-sm hover:text-grey-700",
    {
      "border-grey-200 focus-within:border-blue-500 focus-within:hover:border-blue-500 hover:border-grey-700 ":
        !errors,
      "border-system-error-500 text-system-error-500 ": errors,
    }
  );
  const selectorClassNames = clsx(
    "peer focus:outline-none focus:ring-0 bg-transparent py-1.5 h-full",
    {
      "placeholder:text-grey-400": !errors,
      "group-hover:placeholder:text-grey-700 group-hover:focus:placeholder:text-blue-400 ":
        true,
    }
  );
  const labelClassNames = clsx(
    "text-sm ml-2 px-[2px] peer-focus:text-blue-500",
    {
      "text-grey-400 peer-focus:text-blue-500 group-hover:text-grey-700":
        !errors,
      "text-system-error-500 peer-focus:text-system-error-500": errors,
    }
  );

  const handleSelect = useCallback(
    (newValue: number) => {
      onChange(newValue);
    },
    [onChange]
  );

  const submitInput = useCallback(() => {
    console.log("submitInput", input);
    handleSelect(Number(input));
    setInput("");
  }, [handleSelect, input]);

  return (
    <Select
      value={value}
      onChange={handleSelect}
      by={(a: number | null, b: number | null) => a === b}
    >
      <div className={"inline-grid font-gta "}>
        <fieldset
          className={twMerge(
            clsx(
              "grid grid-cols-auto/1fr/auto group pb-2 w-full",
              parentClassNames
            )
          )}
        >
          <SelectButton
            className={clsx(
              "text-left",
              selectorClassNames,
              "grid grid-cols-1fr/auto",
              className
            )}
          >
            {VerificationOptions[value] ?? value.toString()}
            <CaretIcon className="ml-2  text-grey-400 group-hover:text-grey-700" />
          </SelectButton>

          <SelectOptions
            className={clsx(
              "mt-3 text-sm focus:ring-0 focus:outline-none max-h-32"
            )}
          >
            {VerificationOptions.map((option, index) => (
              <SelectOption key={index} value={index}>
                <div className="grid grid-cols-1fr/auto">
                  {VerificationOptions[index]}
                </div>
              </SelectOption>
            ))}
            {showCustomInput && (
              <SelectOption key={"text-input"} value={input}>
                <input
                  className={clsx(
                    "w-full h-11 px-1 text-sm border border-grey-200 rounded-lg placeholder:text-neutral-secondary"
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
          <legend className={labelClassNames}>{label} </legend>
        </fieldset>
        <div className={clsx("flex flex-col w-full px-2")}>
          {helperText && (
            <p className="mt-2 text-xs text-grey-500">{helperText}</p>
          )}
          {errors?.message && (
            <p className="mt-2 text-xs text-system-error-500">
              {errors.message}
            </p>
          )}
        </div>
      </div>
    </Select>
  );
};
