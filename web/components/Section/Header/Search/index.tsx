import { ComponentProps } from "react";
import clsx from "clsx";

type SearchProps = ComponentProps<"div"> & {};

export const Search = (props: SearchProps) => {
  const { className, ...otherProps } = props;
  return (
    <div
      className={clsx("max-md:mb-8 md:col-start-1 md:mt-8", className)}
      {...otherProps}
    />
  );
};
