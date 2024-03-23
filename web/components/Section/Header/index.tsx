import { ComponentProps } from "react";
import clsx from "clsx";
import { Button } from "./Button";
import { Search } from "./Search";
import { Title } from "./Title";

type HeaderProps = ComponentProps<"div"> & {

};

export const Header = (props: HeaderProps) => {
  const { className, ...otherProps } = props;
  return (
    <div
      className={clsx("contents md:mb-4 md:mt-8 md:grid md:grid-cols-2", className)}
      {...otherProps}
    />
  );
}

Header.Button = Button;
Header.Search = Search;
Header.Title = Title;
