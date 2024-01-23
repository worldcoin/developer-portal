import { Button, CommonButtonProps } from "@/components/Button";
import { memo } from "react";
import { Icon, IconType } from "@/components/Icon";
import clsx from "clsx";

type DecoratedButtonProps = CommonButtonProps & {
  icon?: IconType;
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
        "bg-gray-900 text-white border-white border-opacity-10 bg-gradient-to-b from-white/15 to-transparent inset-0 shadow-button",
      hover: "hover:bg-gradient-to-b hover:from-white/20 hover:to-transparent ",
      disabled: "bg-gray-100 text-gray-300",
      loading: "bg-gray-100 text-gray-400 pointer-events-none",
    },
    secondary: {
      normal: "bg-gray-0 text-gray-700 border-gray-200 shadow-button",
      hover: "hover:bg-gray-100 hover:text-gray-900 ",
      disabled: "bg-gray-0 text-gray-300 border-gray-100",
      loading: "bg-gray-0 text-gray-400 border-gray-200 pointer-events-none",
    },
    danger: {
      normal: "bg-gray-0 text-error-600 border-error-400 inset-0",
      hover: "hover:bg-error-50 ",
      disabled: "border-error-200 text-error-300",
      loading: "border-error-300 text-error-400 pointer-events-none",
    },
  };
  return (
    <Button
      disabled={disabled}
      className={clsx(
        className,
        "px-6 py-2.5 rounded-xl border font-medium ",
        !disabled && !loading && buttonStyles[variant].normal,
        !disabled && !loading && buttonStyles[variant].hover,
        disabled && buttonStyles[variant].disabled,
        loading && buttonStyles[variant].loading
      )}
      {...restProps}
    >
      <div className="gap-2 flex items-center justify-center ">
        {icon && <Icon className={clsx("w-6 h-6")} name={icon} />}
        {props.children}
        {showArrowRight && (
          <Icon name="arrow-right" className={clsx("w-6 h-6")} />
        )}
      </div>
    </Button>
  );
});
