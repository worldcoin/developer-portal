import { ComponentProps } from "react";
import clsx from "clsx";

type ButtonProps = ComponentProps<"div"> & {

};

export const Button = (props: ButtonProps) => {
  const { className, ...otherProps } = props;
  return (
    <div
      className={clsx("grid items-end max-md:sticky max-md:bottom-0 max-md:order-4 max-md:grow max-md:justify-center max-md:py-8 md:col-start-2 md:justify-end", className)}
      {...otherProps}
    />
  );
}
