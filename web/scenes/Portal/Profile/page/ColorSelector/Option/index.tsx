import { Button } from "@/components/Button";
import { Color } from "@/scenes/Portal/Profile/types";
import clsx from "clsx";
import { ButtonHTMLAttributes, CSSProperties } from "react";

export type OptionProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "value"
> & {
  value: Color;
  selected: boolean;
};

export const Option = (props: OptionProps) => {
  const { className, value, selected, ...otherProps } = props;
  return (
    <Button
      type="button"
      className={clsx("cursor-pointer", className)}
      {...otherProps}
      style={
        {
          "--color-500": value?.["500"],
        } as CSSProperties
      }
    >
      <div
        className={clsx(
          "flex size-6 items-center justify-center rounded-full bg-[var(--color-500)] transition-all",
          {
            "shadow-[0_0_0_2px_rgba(255,255,255,.12)_inset]": selected,
            "opacity-40 shadow-[0_0_0_0_rgba(255,255,255,0)_inset]": !selected,
          },
        )}
      >
        <div
          className={clsx("rounded-full bg-grey-0 transition-all ease-in", {
            "h-2.5 w-2.5": selected,
            "h-4 w-4": !selected,
          })}
        />
      </div>
    </Button>
  );
};

