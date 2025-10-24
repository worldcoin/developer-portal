"use client";

import clsx from "clsx";
import type { OTPInputProps } from "input-otp";
import {
  OTPInput,
  REGEXP_ONLY_CHARS,
  REGEXP_ONLY_DIGITS,
  REGEXP_ONLY_DIGITS_AND_CHARS,
} from "input-otp";
import * as React from "react";
import { FieldError } from "react-hook-form";

const patternDictionary = {
  digits: REGEXP_ONLY_DIGITS,
  chars: REGEXP_ONLY_CHARS,
  digitsAndChars: REGEXP_ONLY_DIGITS_AND_CHARS,
};

const inputModeDictionary = {
  digits: "numeric",
  chars: "text",
  digitsAndChars: "text",
} as const;

type OTPFieldProps = Omit<
  OTPInputProps,
  | "render"
  | "className"
  | "containerClassName"
  | "textAlign"
  | "inputMode"
  | "pushPasswordManagerStrategy"
  | "noScriptCSSFallback"
  | "maxLength"
  | "placeholder"
> & {
  maxLength?: number;
  error?: FieldError;
  pattern?: string;
  mode?: keyof typeof patternDictionary;
  value?: string;
  onChange?: (newValue: string) => unknown;
  onComplete?: (...args: any[]) => unknown;
  pasteTransformer?: (pastedText: string) => string;
};

export const OtpInput = React.forwardRef<
  React.ElementRef<typeof OTPInput>,
  OTPFieldProps
>(
  (
    {
      maxLength = 6,
      error,
      children,
      mode = "digits",
      pattern,
      onChange,
      ...props
    },
    ref,
  ) => {
    return (
      <div className="flex w-full flex-col gap-y-3">
        <OTPInput
          ref={ref}
          {...props}
          maxLength={maxLength}
          inputMode={inputModeDictionary[mode]}
          pattern={pattern || patternDictionary[mode]}
          onChange={onChange}
          containerClassName="flex items-center gap-2"
          render={({ slots }) => (
            <>
              {slots.map(({ isActive, char }, idx) => (
                <div
                  key={idx}
                  role="textbox"
                  className={clsx(
                    // Base styles matching your Input component
                    "flex h-[56px] w-[46px] items-center justify-center rounded-lg border-[1px] bg-grey-0 text-center",
                    "text-2xl leading-9 transition-all duration-200",

                    {
                      // Active/focused state - using your Input's blue focus color
                      "border-blue-500 bg-grey-0": isActive,
                      // Inactive state - using your Input's grey border
                      "border-grey-200 bg-grey-0": !isActive && !error,
                      // Error state - using your Input's error colors
                      "border-system-error-500 bg-grey-0 text-system-error-500":
                        error,
                      // Disabled state - using your Input's disabled colors
                      "border-grey-200 bg-grey-50 text-grey-400":
                        props.disabled,
                    },
                  )}
                >
                  {char}
                </div>
              ))}
            </>
          )}
        />

        {error?.message && (
          <p className="text-xs text-red-500">{error.message}</p>
        )}
      </div>
    );
  },
);
