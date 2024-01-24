import { CSSProperties, memo } from "react";
import clsx from "clsx";

const iconNames = ["arrow-right"] as const;

export type IconType = (typeof iconNames)[number];

export const Icon = memo(function Icon(
  props: {
    className?: string;
    noMask?: boolean;
    testId?: string;
  } & (
    | {
        name: IconType;
        path?: never;
      }
    | {
        name?: never;
        path?: string;
      }
  )
) {
  const iconStyle: CSSProperties = {
    contain: "strict",
    ...(props.noMask
      ? {
          backgroundImage: `url("${props.path ?? `/icons/${props.name}.svg`}")`,
          backgroundSize: "contain",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }
      : {
          maskImage: `url("${props.path ?? `/icons/${props.name}.svg`}")`,
          maskSize: "contain",
          maskPosition: "center",
          maskRepeat: "no-repeat",
        }),
  };
  return (
    <span
      className={clsx(
        "inline-block pointer-events-none",

        {
          "bg-current": !props.noMask,
          "no-mask": props.noMask,
        },

        props.className
      )}
      {...(props.testId && { "data-testid": props.testId })}
      role="icon"
      style={iconStyle}
    />
  );
});
