import { HTMLAttributes } from "react";
import { twMerge } from "tailwind-merge";

export * from "./Tab";

type TabsProps = HTMLAttributes<HTMLDivElement>;

export const Tabs = (props: TabsProps) => {
  const { className, ...otherProps } = props;
  return <div className={twMerge("flex gap-x-4", className)} {...otherProps} />;
};
