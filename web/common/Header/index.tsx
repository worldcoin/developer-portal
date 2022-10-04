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
        "grid grid-cols-1fr/auto items-center shrink-0",
        props.className
      )}
    >
      {props.children}
    </header>
  );
});
