import cn from "classnames";
import { memo, ReactNode } from "react";

type NavItemGroupProps = {
  children: ReactNode;
  className?: string;
} & (
  | {
      heading: string;
      withoutHeading?: never;
    }
  | {
      heading?: never;
      withoutHeading: true;
    }
);

export const NavItemGroup = memo(function NavItemGroup(
  props: NavItemGroupProps
) {
  return (
    <div className={cn("grid gap-y-4", props.className)}>
      {props.heading && (
        <span className="uppercase text-12 font-sora font-semibold text-neutral-secondary">
          {props.heading}
        </span>
      )}

      <div className="grid gap-y-2">{props.children}</div>
    </div>
  );
});
