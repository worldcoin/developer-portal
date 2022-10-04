import { memo, useCallback, ChangeEvent } from "react";
import cn from "classnames";

interface SwitchInterface {
  className?: string;
  checked: boolean;
  onChangeChecked: (checked: boolean) => void;
}

export const Switch = memo(function Switch(props: SwitchInterface) {
  const { onChangeChecked } = props;

  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      onChangeChecked(event.target.checked);
    },
    [onChangeChecked]
  );

  return (
    <label
      className={cn(
        "relative w-16 h-8 border rounded-2xl",
        "after:absolute after:w-[26px] after:h-[26px] after:top-[2px] after:bg-ffffff after:rounded-full",
        { "border-primary/10 bg-primary/5 after:left-[2px]": !props.checked },
        { "border-primary bg-primary after:right-[2px]": props.checked },
        props.className
      )}
    >
      <input
        className="sr-only"
        type="checkbox"
        checked={props.checked}
        onChange={handleChange}
      />
    </label>
  );
});
