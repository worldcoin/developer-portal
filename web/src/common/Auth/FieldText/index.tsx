import { HTMLAttributes, memo } from "react";
import cn from "classnames";

interface FieldTextInterface extends HTMLAttributes<HTMLDivElement> {}

export const FieldText = memo(function FieldText(props: FieldTextInterface) {
  const { className, children, ...otherProps } = props;

  return (
    <p
      className={cn(className, "text-12 text-neutral-secondary leading-4")}
      {...otherProps}
    >
      {children}
    </p>
  );
});
