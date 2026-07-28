import { Button } from "@/components/Button";
import { Color } from "@/scenes/common/Profile/types";
import clsx from "clsx";
import { ButtonHTMLAttributes, CSSProperties } from "react";

export type OptionProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "value"
> & {
  value: Color;
  selected: boolean;
  initial: string;
};

export const Option = (props: OptionProps) => {
  const { className, value, selected, initial, ...otherProps } = props;

  return (
    <Button
      type="button"
      className={clsx(
        "flex size-7 cursor-pointer items-center justify-center rounded-full bg-(--color-100) font-world text-12 font-medium text-(--color-500) uppercase outline-hidden transition-shadow focus-visible:ring-2 focus-visible:ring-grey-300 focus-visible:ring-offset-2",
        {
          "shadow-[0_0_0_2px_#fff,0_0_0_4px_var(--color-500)]": selected,
        },
        className,
      )}
      {...otherProps}
      style={
        {
          "--color-100": value?.["100"],
          "--color-500": value?.["500"],
        } as CSSProperties
      }
    >
      {initial}
    </Button>
  );
};
