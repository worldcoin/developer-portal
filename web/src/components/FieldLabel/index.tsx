import { LabelHTMLAttributes, memo } from "react";
import cn from "classnames";

interface FieldLabelInterface extends LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
  isPublic?: boolean;
  description?: string;
}

export const FieldLabel = memo(function FieldLabel(props: FieldLabelInterface) {
  const {
    className,
    children,
    required,
    description,
    isPublic,
    ...otherProps
  } = props;

  return (
    <div className={cn("grid gap-y-1", className)}>
      <label className={cn("flex gap-x-2 text-16 leading-5")} {...otherProps}>
        {children}
        {!required && (
          <span className="text-neutral-secondary">(optional)</span>
        )}
        {isPublic && <span className="text-neutral-secondary">(public)</span>}
      </label>

      {description && (
        <span className="text-14 text-gray-400 leading-[1.3]">
          {description}
        </span>
      )}
    </div>
  );
});
