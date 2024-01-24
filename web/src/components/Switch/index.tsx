import { memo, useCallback, ChangeEvent } from "react";
import cn from "classnames";
import { Switch as BaseSwitch } from "@headlessui/react";

interface SwitchInterface {
  className?: string;
  checked?: boolean;
  toggle: (value?: boolean) => void;
  customColors?: {
    checked?: string;
    unchecked?: string;
  };
}

export const Switch = memo(function Switch(props: SwitchInterface) {
  return (
    <BaseSwitch
      checked={props.checked}
      onChange={props.toggle}
      className={cn(
        "relative inline-flex w-11 h-6 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2  focus-visible:ring-white focus-visible:ring-opacity-75",
        {
          [`${props.customColors?.unchecked ?? "bg-neutral-secondary"}`]:
            !props.checked,
        },
        { [`${props.customColors?.checked ?? "bg-primary"}`]: props.checked },
        props.className
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-ffffff shadow-lg ring-0 transition duration-200 ease-in-out",
          { "translate-x-5": props.checked },
          { "translate-x-0": !props.checked }
        )}
      />
    </BaseSwitch>
  );
});
