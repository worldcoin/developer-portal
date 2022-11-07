import { memo, useCallback, ChangeEvent } from "react";
import cn from "classnames";

interface SwitchInterface {
  className?: string;
  checked?: boolean;
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
        "relative w-16 h-8 border rounded-2xl cursor-pointer transition-colors after:transition-[left]",
        "after:absolute after:w-[26px] after:h-[26px] after:top-0.5 after:bg-ffffff after:rounded-full",
        {
          "border-primary/10 bg-primary/5 after:left-0.5 ": !props.checked,
        },
        {
          "border-primary bg-primary after:left-[calc(100%-28px)]":
            props.checked,
        },
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
