import { HTMLAttributes } from "react";
import { twMerge } from "tailwind-merge";

type ListSeparatorProps = HTMLAttributes<HTMLHRElement> & {};

export const ListSeparator = (props: ListSeparatorProps) => {
  const { className, ...otherProps } = props;

  return (
    <hr
      className={twMerge("my-1 border-grey-200", className)}
      {...otherProps}
    />
  );
};
