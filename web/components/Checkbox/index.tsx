import clsx from "clsx";
import { ComponentProps } from "react";
import { UseFormRegisterReturn } from "react-hook-form";
import { twMerge } from "tailwind-merge";
import { CheckIcon } from "../Icons/CheckIcon";

export const Checkbox = (
  props: ComponentProps<"input"> & {
    register: UseFormRegisterReturn;
    disabled?: boolean;
  },
) => {
  return (
    <label
      className={twMerge(
        clsx(
          "relative size-6 rounded-md ",
          { "opacity-50": props.disabled },
          props.className,
        ),
      )}
    >
      <input
        disabled={props.disabled}
        {...props.register}
        type="checkbox"
        className="peer hidden"
      />
      <div className="pointer-events-none absolute inset-0 z-10 size-full rounded-md shadow-[0px_0px_0px_1px_inset] shadow-grey-300 transition-colors peer-checked:shadow-grey-100/20" />

      <div className="invisible absolute inset-0 flex cursor-pointer items-center justify-center rounded-md bg-grey-900 opacity-0 transition-[visibility,opacity] peer-checked:visible peer-checked:opacity-100">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-grey-0/10 to-transparent" />
        <CheckIcon size="16" className="text-grey-0" />
      </div>
    </label>
  );
};
