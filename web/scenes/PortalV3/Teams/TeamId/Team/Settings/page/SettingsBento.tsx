import type { ComponentProps } from "react";
import { twMerge } from "tailwind-merge";

type SettingsBentoProps = ComponentProps<"div">;

export const SettingsBento = (props: SettingsBentoProps) => {
  const { className, ...otherProps } = props;

  return (
    <div
      className={twMerge(
        "grid grid-cols-1 items-stretch gap-5 xl:grid-cols-12",
        className,
      )}
      {...otherProps}
    />
  );
};

type SettingsBentoItemProps = ComponentProps<"div"> & {
  span?: "full" | "wide" | "narrow";
};

const Item = (props: SettingsBentoItemProps) => {
  const { className, span = "full", ...otherProps } = props;
  const spanClassName = {
    full: "xl:col-span-12",
    wide: "xl:col-span-7",
    narrow: "xl:col-span-5",
  }[span];

  return (
    <div
      className={twMerge("min-w-0", spanClassName, className)}
      {...otherProps}
    />
  );
};

SettingsBento.Item = Item;
