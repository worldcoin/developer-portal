import { memo } from "react";
import cn from "classnames";

interface CodeInterface {
  children: JSX.Element | string | JSX.Element[];
  className?: string;
  title?: string;
}

export const Code = memo(function Code(props: CodeInterface): JSX.Element {
  const { children, className, ...restOfProps } = props;
  return (
    <code
      className={cn("inline-block px-1 bg-neutral-muted rounded", className)}
      {...restOfProps}
    >
      {children}
    </code>
  );
});
