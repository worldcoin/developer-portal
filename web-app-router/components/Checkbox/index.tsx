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
          "h-6 w-6 relative rounded-md ",
          { "opacity-50": props.disabled },
          props.className,
        ),
      )}
    >
      <input
        disabled={props.disabled}
        {...props.register}
        type="checkbox"
        className="hidden peer"
      />
      <div className="w-full h-full absolute rounded-md inset-0 z-10 pointer-events-none shadow-[0px_0px_0px_1px_inset] shadow-grey-300 peer-checked:shadow-grey-100/20 transition-colors" />

      <div className="cursor-pointer absolute inset-0 flex justify-center items-center bg-grey-900 invisible opacity-0 peer-checked:visible peer-checked:opacity-100 rounded-md transition-[visibility,opacity]">
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-grey-0/10 to-transparent" />
        <CheckIcon size="16" className="text-grey-0" />
      </div>
    </label>
  );
};
