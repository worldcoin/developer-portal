import { ButtonHTMLAttributes, memo } from "react";
import { tv, type VariantProps } from "tailwind-variants";

const button = tv({
  base: "flex items-center justify-center gap-x-2 min-w-[156px] h-11 px-6 leading-1px font-medium text-16 tracking-tight whitespace-nowrap",
  variants: {
    variant: {
      contained: "",
      outlined: "",
    },
    color: {
      neutral: "",
      success: "",
      danger: "",
    },
  },
  compoundVariants: [
    {
      variant: "contained",
      color: "neutral",
      class:
        "text-white bg-gray-900 bg-gradient-to-b from-white/10 to-white/0 rounded-xl shadow-[0_0_0_1px_theme(colors.gray.900),_0_1px_2px_0_rgba(25,28,32,0.48)]",
    },
    {
      variant: "contained",
      color: "success",
      class:
        "text-white bg-success bg-gradient-to-b from-white/10 to-white/0 rounded-xl shadow-[0_0_0_1px_theme(colors.success.DEFAULT),_0_1px_2px_0_rgba(25,28,32,0.24)]",
    },
    {
      variant: "outlined",
      color: "neutral",
      class:
        "text-gray-700 bg-white border border-gray-200 rounded-xl shadow-[0_1px_2px_0_rgba(25,28,32,0.06)]",
    },
  ],
  defaultVariants: {
    color: "neutral",
  },
});

type ButtonProps = VariantProps<typeof button> &
  ButtonHTMLAttributes<HTMLButtonElement>;

export const Button = memo(function Button(props: ButtonProps) {
  const { variant, color, className, disabled, ...otherProps } = props;

  return (
    <button
      className={button({ variant, color, className })}
      disabled={disabled}
      {...otherProps}
    />
  );
});
