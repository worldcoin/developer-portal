import { ButtonHTMLAttributes, memo } from "react";
import cn from "classnames";

interface ButtonInterface extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "plain";
}

export const Button = memo(function Button(props: ButtonInterface) {
  const { variant = "primary", className, disabled, ...otherProps } = props;

  return (
    <button
      className={cn(
        className,
        "flex items-center font-semibold justify-center text-center",
        {
          "font-sora text-16 text-ffffff leading-5 rounded-xl":
            variant === "primary",

          "bg-neutral-primary hover:bg-neutral-primary/95 hover:active:bg-neutral-primary/90 shadow-button":
            !disabled && variant === "primary",

          "bg-ebecef": disabled && variant === "primary",
        },
        {
          "bg-f3f4f5 hover:bg-neutral-dark hover:text-ffffff border border-ebecef hover:border-neutral-dark transition-colors text-14 leading-none font-medium rounded-lg":
            variant === "secondary",
        },
        {
          "font-sora bg-danger-light hover:bg-danger/20 transition-colors text-danger text-16 leading-5 rounded-xl":
            variant === "danger",
        },
        {
          "font-sora bg-transparent text-16 leading-5 text-neutral-secondary":
            variant === "plain",
        }
      )}
      disabled={disabled}
      {...otherProps}
    />
  );
});
