import clsx from "clsx";
import { Switch } from "@headlessui/react";

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
          "bg-grey-900": enabled,
          "bg-gray-200": !enabled,
        },
        {
          " bg-gradient-to-b from-white/15 to-transparent ": enabled,
        },

        "relative inline-flex h-6 w-10 items-center rounded-full",
      )}
    >
      <span
        className={clsx(
          {
            "translate-x-[1.1rem]": enabled,
            "translate-x-[.15rem]": !enabled,
          },
          "inline-block h-[20px] w-[20px] transform rounded-full bg-white transition",
          "after:content-[''] after:absolute after:top-1/2 after:left-1/2 after:w-[17px] after:h-[17px] after:rounded-full after:-translate-x-1/2 after:-translate-y-1/2 after:bg-gradient-to-b from-[#D3D4D645] to-white ",
        )}
      />
    </Switch>
  );
};
