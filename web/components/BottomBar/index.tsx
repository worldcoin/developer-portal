import { HTMLAttributes } from "react";
import { twMerge } from "tailwind-merge";
import { BottomBarLink } from "@/components/BottomBar/Link";

export { BottomBarLink };

type BottomBarProps = HTMLAttributes<HTMLDivElement>;

export const BottomBar = (props: BottomBarProps) => {
  const { className, ...otherProps } = props;

  return (
    <div
      className={twMerge(
        "sticky bottom-0 grid h-[4.25rem] grid-cols-4 border-t border-grey-70 bg-grey-0 md:hidden",
        className,
      )}
      {...otherProps}
    />
  );
};

BottomBar.Link = BottomBarLink;
