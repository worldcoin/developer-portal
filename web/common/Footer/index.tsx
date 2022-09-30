import { memo, ReactNode } from "react";
import cn from "classnames";

interface FooterInterface {
  className?: string;
  children: ReactNode;
}

export const Footer = memo(function Footer(props: FooterInterface) {
  return (
    <footer
      className={cn(
        "sticky bottom-0 h-20 px-4 lg:px-8 xl:px-16 bg-ffffff z-header border-t border-neutral-muted",
        "grid grid-flow-col items-center shrink-0",
        props.className
      )}
    >
      {props.children}
    </footer>
  );
});
