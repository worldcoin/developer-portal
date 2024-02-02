"use client";
import clsx from "clsx";
import { InputHTMLAttributes, memo } from "react";
import { useForm } from "react-hook-form";
import { twMerge } from "tailwind-merge";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { validateUrl } from "@/lib/utils";

interface InputInterface extends InputHTMLAttributes<HTMLInputElement> {
  required?: boolean;
  currentValue?: string;
  placeholder?: string;
  helperText?: string;
  addOnRight?: React.ReactElement;
  className?: string;
  handleChange: (value: string) => void;
}

const schema = yup.object({
  url: yup
    .string()
    .required("A valid url is required")
    .test("is-url", "Must be a valid URL", (value) => {
      return value != null ? validateUrl(value) : true;
    }),
});

type UrlFormValues = yup.InferType<typeof schema>;

export const RedirectInput = memo(function Input(props: InputInterface) {
  const {
    required,
    currentValue,
    helperText,
    placeholder,
    className,
    addOnRight,
    disabled,
    handleChange,
    ...restProps
  } = props;

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
    "border-[1px] text-grey-700 rounded-lg bg-grey-0 px-2 text-sm",
    {
      "border-grey-200 focus-within:border-blue-500 focus-within:hover:border-blue-500 hover:border-grey-700 ":
        !errors.url && !disabled,
      "border-system-error-500 text-system-error-500 focus-within:border-system-error-500":
        errors.url && !disabled,
    },
    {
      "hover:text-grey-700": !disabled,
      "bg-grey-50 text-grey-300 border-grey-200": disabled,
    }
  );

  const inputClassNames = clsx(
    "peer focus:outline-none focus:ring-0 bg-transparent px-2 py-2 h-full w-full",
    {
      "placeholder:text-grey-400": !errors.url,
      "group-hover:placeholder:text-grey-700 group-hover:focus:placeholder:text-grey-400 ":
        !disabled,
    }
  );

  const handleSave = handleSubmit((data) => {
    handleChange(data.url);
  });

  return (
    <form onSubmit={handleSave}>
      <fieldset
        className={twMerge(
          clsx("grid grid-cols-1fr/auto group", parentClassNames),
          typeof className === "string" ? className : undefined
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
      <div className={clsx("flex flex-col w-full px-2")}>
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
