import { ButtonHTMLAttributes, memo } from "react";
import cn from "classnames";

interface ButtonInterface extends ButtonHTMLAttributes<HTMLButtonElement> {}

export const Button = memo(function Button(props: ButtonInterface) {
  const { className, disabled, ...otherProps } = props;

  return (
    <button
      className={cn(
        className,
        "flex items-center justify-center text-center font-sora font-semibold text-16 text-ffffff leading-5 rounded-xl",
        {
          "bg-neutral-primary hover:bg-neutral-primary/95 hover:active:bg-neutral-primary/90 shadow-button":
            !disabled,
        },
        { "bg-ebecef": disabled }
      )}
      {...otherProps}
    />
  );
});
