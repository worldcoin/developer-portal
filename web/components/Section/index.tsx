import { ComponentProps } from "react";
import clsx from "clsx";
import { Header } from "./Header";

type SectionProps = ComponentProps<"div"> & {

};

export const Section = (props: SectionProps) => {
  const { className, ...otherProps } = props;
  return (
    <div
      className={clsx("contents md:mb-8 md:block", className)}
      {...otherProps}
    />
  );
}

Section.Header = Header;
