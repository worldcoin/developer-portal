import { ButtonHTMLAttributes, CSSProperties } from "react";
import { Color } from "@/scenes/Portal/Profile/types";
import clsx from "clsx";
import { Button } from "@/components/Button";

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
          "h-6 w-6 bg-[var(--color-500)] flex justify-center items-center rounded-full transition-all",
          {
            "shadow-[0_0_0_2px_rgba(255,255,255,.12)_inset]": selected,
            "shadow-[0_0_0_0_rgba(255,255,255,0)_inset] opacity-40": !selected,
          },
        )}
      >
        <div
          className={clsx("rounded-full bg-grey-0 transition-all ease-in", {
            "w-2.5 h-2.5": selected,
            "w-4 h-4": !selected,
          })}
        />
      </div>
    </Button>
  );
};
