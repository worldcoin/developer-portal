import { LabelHTMLAttributes, memo } from "react";
import cn from "classnames";

interface FieldLabelInterface extends LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

export const FieldLabel = memo(function FieldLabel(props: FieldLabelInterface) {
  const { className, children, required, ...otherProps } = props;

  return (
    <label
      className={cn(className, "flex gap-x-2 text-16 leading-5")}
      {...otherProps}
    >
      {children}
      {!required && <span className="text-neutral-secondary">(optional)</span>}
    </label>
  );
});
