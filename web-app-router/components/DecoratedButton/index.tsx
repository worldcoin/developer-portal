import { Button, CommonButtonProps } from "@/components/Button";
import { memo } from "react";
import clsx from "clsx";
import { ArrowRightIcon } from "../Icons";

type DecoratedButtonProps = CommonButtonProps & {
  icon?: React.ReactElement;
  showArrowRight?: boolean;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  variant?: "primary" | "secondary" | "danger";
};

export const DecoratedButton = memo(function DecoratedButton(
  props: DecoratedButtonProps
) {
  const {
    icon,
    showArrowRight,
    loading,
    disabled,
    className,
    variant = "primary",
    ...restProps
  } = props;

  const buttonStyles = {
    primary: {
      normal:
        "bg-gray-900 text-white bg-gradient-to-b border-gray-900 from-white/15 to-transparent shadow-button",
      hover: "hover:bg-gradient-to-b hover:from-white/20 hover:to-transparent ",
      disabled: "bg-gray-100 text-gray-300 pointer-events-none",
      loading: "bg-gray-100 text-gray-400 pointer-events-none",
    },
    secondary: {
      normal: "bg-gray-0 text-gray-700 border-gray-200 shadow-button",
      hover: "hover:bg-gray-100 hover:text-gray-900 ",
      disabled: "bg-gray-0 text-gray-300 border-gray-100 pointer-events-none",
      loading: "bg-gray-0 text-gray-400 border-gray-200 pointer-events-none",
    },
    danger: {
      normal: "bg-gray-0 text-error-600 border-error-400 inset-0",
      hover: "hover:bg-error-50 ",
      disabled: "border-error-200 text-error-300 pointer-events-none",
      loading: "border-error-300 text-error-400 pointer-events-none",
    },
  };

  return (
    <Button
      disabled={disabled}
      className={clsx(
        className,
        "px-6 py-2.5 rounded-xl border font-medium relative",
        { [buttonStyles[variant].normal]: !disabled && !loading },
        { [buttonStyles[variant].hover]: !disabled && !loading },
        disabled && buttonStyles[variant].disabled,
        loading && buttonStyles[variant].loading
      )}
      {...restProps}
    >
      <div
        className={clsx("gap-2 flex items-center justify-center", {
          "before:absolute before:inset-0 before:rounded-[11px] before:shadow-[0_0_0_1px_rgba(255,255,255,.1)_inset]":
            variant === "primary",
        })}
      >
        {icon}
        {props.children}
        {showArrowRight && <ArrowRightIcon className="w-6 h-6" />}
      </div>
    </Button>
  );
});
