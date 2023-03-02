import { Icon } from "src/common/Icon";
import { memo } from "react";
import cn from "classnames";

export const InputError = memo(function InputError(props: { error?: string }) {
  return (
    <div
      className={cn(
        "grid grid-cols-auto/1fr gap-x-2 items-center transition-visibility/opacity duration-100",
        { "invisible opacity-0 pointer-events-none": !props.error }
      )}
    >
      <Icon name="warning" className="w-4 h-4 text-danger" />
      <span className="text-danger text-12 leading-none">{props.error}</span>
    </div>
  );
});
