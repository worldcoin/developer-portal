"use client";

import clsx from "clsx";

type ToggleProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
  disabled?: boolean;
};

/**
 * Fully controlled toggle component.
 *
 * This component is intentionally fully controlled (no internal state) to ensure
 * it always reflects the parent's state. The previous implementation used useState
 * which only initialized once, causing desync issues when the `checked` prop changed
 * after mount (e.g., form resets, external state updates).
 *
 * All existing usages already follow the controlled pattern (passing checked + onChange),
 * so this change fixes a bug without breaking existing functionality.
 */
export const Toggle = (props: ToggleProps) => {
  const { checked, onChange, className, disabled } = props;

  const handleToggle = () => {
    if (disabled) return;
    onChange(!checked);
  };

  return (
    <button
      type="button"
      className={clsx(
        "relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent ring-offset-surface transition-colors duration-200 ease-in-out focus:outline-hidden focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 enabled:hover:ring-2 enabled:hover:ring-edge-medium",
        {
          "bg-grey-900 dark:bg-action": checked,
          "bg-surface-disabled": !checked,
          "cursor-not-allowed opacity-50": disabled,
        },
        className,
      )}
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={handleToggle}
    >
      <span
        className={clsx(
          "pointer-events-none inline-block size-5 rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out",
          checked && "dark:bg-action-foreground",
          {
            "translate-x-5": checked,
            "translate-x-0": !checked,
          },
        )}
      />
    </button>
  );
};
