import { HTMLAttributes } from "react";
import { twMerge } from "tailwind-merge";

type ListHeaderProps = HTMLAttributes<HTMLDivElement> & {};

export const ListHeader = (props: ListHeaderProps) => {
  const { className, ...otherProps } = props;

  return (
    <div
      className={twMerge(
        "truncate px-2 py-2.5 text-sm leading-5 text-grey-400 md:px-4",
        className,
      )}
      {...otherProps}
    />
  );
};
