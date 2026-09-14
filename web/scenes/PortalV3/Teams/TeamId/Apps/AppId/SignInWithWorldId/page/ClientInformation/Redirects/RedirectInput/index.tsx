"use client";
import { validateUrl } from "@/lib/utils";
import { yupResolver } from "@hookform/resolvers/yup";
import clsx from "clsx";
import { InputHTMLAttributes, memo, useMemo } from "react";
import { useForm } from "react-hook-form";
import { twMerge } from "tailwind-merge";
import * as yup from "yup";

interface InputInterface extends InputHTMLAttributes<HTMLInputElement> {
  required?: boolean;
  currentValue?: string;
  placeholder?: string;
  helperText?: string;
  addOnRight?: React.ReactElement;
  className?: string;
  isStaging: boolean;
  handleChange: (value: string) => void;
}

export const RedirectInput = memo(function Input(props: InputInterface) {
  const {
    required,
    currentValue,
    helperText,
    placeholder,
    className,
    addOnRight,
    disabled,
    isStaging,
    handleChange,
  } = props;

  const schema = useMemo(
    () =>
      yup
        .object({
          url: yup
            .string()
            .required("A valid url is required")
            .test("is-url", "Must be a valid URL", (value) => {
              return value != null ? validateUrl(value, isStaging) : true;
            }),
        })
        .noUnknown(),
    [isStaging],
  );

  type UrlFormValues = yup.InferType<typeof schema>;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UrlFormValues>({
    resolver: yupResolver(schema),
    mode: "onChange",
    shouldFocusError: false,
    defaultValues: {
      url: currentValue ?? "",
    },
  });

  const parentClassNames = clsx(
    "rounded-lg border bg-surface px-2 text-sm text-content-strong",
    {
      "border-edge focus-within:border-focus focus-within:hover:border-focus hover:border-edge-heavy ":
        !errors.url && !disabled,
      "border-edge-error-500 text-content-error-500 focus-within:border-edge-error-500":
        errors.url && !disabled,
    },
    {
      "hover:text-content-strong": !disabled,
      "bg-surface-soft text-content-disabled border-edge": disabled,
    },
  );

  const inputClassNames = clsx(
    "peer size-full bg-transparent p-2 focus:outline-hidden focus:ring-0",
    {
      "placeholder:text-content-tertiary": !errors.url,
      "group-hover:placeholder:text-content-strong focus:group-hover:placeholder:text-content-tertiary ":
        !disabled,
    },
  );

  const handleSave = handleSubmit((data) => {
    handleChange(data.url);
  });

  return (
    <form onSubmit={handleSave}>
      <fieldset
        className={twMerge(
          clsx("group grid grid-cols-1fr/auto", parentClassNames),
          typeof className === "string" ? className : undefined,
        )}
      >
        <input
          {...register("url", { onBlur: handleSave })}
          className={clsx(inputClassNames)}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          aria-invalid={errors.url ? "true" : "false"}
        />
        <div className="flex items-center">{addOnRight && addOnRight}</div>
      </fieldset>
      <div className={clsx("flex w-full flex-col px-2")}>
        {helperText && (
          <p className="mt-2 text-xs text-content-secondary">{helperText}</p>
        )}
        {errors?.url?.message && (
          <p className="mt-2 text-xs text-content-error-500">
            {errors.url.message}
          </p>
        )}
      </div>
    </form>
  );
});
