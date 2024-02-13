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
          "inline-block size-[20px] rounded-full bg-white transition",
          "from-[#D3D4D645] to-white after:absolute after:left-1/2 after:top-1/2 after:size-[17px] after:-translate-x-1/2 after:-translate-y-1/2 after:rounded-full after:bg-gradient-to-b after:content-[''] ",
        )}
      />
    </Switch>
  );
};
