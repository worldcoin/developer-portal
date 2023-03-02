import { Icon } from "src/common/Icon";
import cn from "classnames";

// FIXME: Update styling to match the new design.
export const Spinner = ({ className }: { className?: string }): JSX.Element => {
  return (
    <Icon
      noMask
      className={cn("w-8 h-8 animate-spin", className)}
      name="spinner-gradient"
    />
  );
};
