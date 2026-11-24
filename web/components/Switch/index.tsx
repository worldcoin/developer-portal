import { Switch } from "@headlessui/react";
import clsx from "clsx";

type SwitchProps = {
  enabled: boolean;
  disabled?: boolean;
  setEnabled: (enabled: boolean) => void;
};
export const Switcher = (props: SwitchProps) => {
  const { enabled, disabled, setEnabled } = props;
  return (
    <Switch
      checked={enabled}
      disabled={disabled}
      onChange={setEnabled}
      className={clsx(
        {
          "bg-grey-900 dark:bg-action": enabled,
          "bg-gray-200 dark:bg-surface-disabled": !enabled,
        },
        {
          "bg-linear-to-b from-white/15 to-transparent": enabled,
        },

        "relative inline-flex h-6 w-10 items-center rounded-full ring-offset-surface outline-hidden transition-colors focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 enabled:hover:ring-2 enabled:hover:ring-edge-medium disabled:cursor-not-allowed disabled:opacity-50",
      )}
    >
      <span
        className={clsx(
          {
            "translate-x-[1.1rem]": enabled,
            "translate-x-[.15rem]": !enabled,
          },
          "inline-block size-[20px] rounded-full bg-white transition",
          enabled && "dark:bg-action-foreground",
          "from-[#D3D4D645] to-white after:absolute after:top-1/2 after:left-1/2 after:size-[17px] after:-translate-x-1/2 after:-translate-y-1/2 after:rounded-full after:bg-linear-to-b after:content-['']",
        )}
      />
    </Switch>
  );
};
