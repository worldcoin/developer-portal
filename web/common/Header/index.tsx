import { memo, ReactNode } from "react";
import cn from "classnames";

interface HeaderInterface {
  className?: string;
  children: ReactNode;
}

export const Header = memo(function Header(props: HeaderInterface) {
  return (
    <header
      className={cn(
        "sticky top-0 px-4 lg:px-8 xl:px-16 bg-ffffff z-header border-b border-neutral-muted",
        "flex flex-wrap justify-between gap-y-4 items-center shrink-0",
        props.className
      )}
    >
      {props.children}
    </header>
  );
});
