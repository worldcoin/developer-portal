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
    "rounded-lg border-[1px] bg-grey-0 px-2 text-sm text-grey-700",
    {
      "border-grey-200 focus-within:border-blue-500 focus-within:hover:border-blue-500 hover:border-grey-700 ":
        !errors.url && !disabled,
      "border-system-error-500 text-system-error-500 focus-within:border-system-error-500":
        errors.url && !disabled,
    },
    {
      "hover:text-grey-700": !disabled,
      "bg-grey-50 text-grey-300 border-grey-200": disabled,
    },
  );

  const inputClassNames = clsx(
    "peer size-full bg-transparent p-2 focus:outline-none focus:ring-0",
    {
      "placeholder:text-grey-400": !errors.url,
      "group-hover:placeholder:text-grey-700 group-hover:focus:placeholder:text-grey-400 ":
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
          <p className="mt-2 text-xs text-grey-500">{helperText}</p>
        )}
        {errors?.url?.message && (
          <p className="mt-2 text-xs text-system-error-500">
            {errors.url.message}
          </p>
        )}
      </div>
    </form>
  );
});
