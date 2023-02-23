import { HTMLAttributes, memo } from "react";
import cn from "classnames";

interface TypographyInterface extends HTMLAttributes<HTMLElement> {
  variant?: "title" | "subtitle";
}

export const Typography = memo(function Typography(props: TypographyInterface) {
  const { className, variant = "title", ...otherProps } = props;
  const Component = variant === "title" ? "h1" : "p";

  return (
    <Component
      className={cn(
        className,
        "text-center",
        { "font-sora font-semibold text-32 leading-10": variant === "title" },
        {
          "font-rubik text-16 text-neutral-medium leading-5":
            variant === "subtitle",
        }
      )}
      {...otherProps}
    />
  );
});
