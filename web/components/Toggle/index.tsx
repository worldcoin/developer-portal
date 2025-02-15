"use client";

import clsx from "clsx";
import { useState } from "react";

type ToggleProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
  disabled?: boolean;
};

export const Toggle = (props: ToggleProps) => {
  const { checked, onChange, className, disabled } = props;
  const [isChecked, setIsChecked] = useState(checked);

  const handleToggle = () => {
    if (disabled) return;
    const newState = !isChecked;
    setIsChecked(newState);
    onChange(newState);
  };

  return (
    <button
      type="button"
      className={clsx(
        "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
        {
          "bg-blue-500": isChecked,
          "bg-grey-200": !isChecked,
          "cursor-not-allowed opacity-50": disabled,
        },
        className,
      )}
      role="switch"
      aria-checked={isChecked}
      disabled={disabled}
      onClick={handleToggle}
    >
      <span
        className={clsx(
          "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
          {
            "translate-x-5": isChecked,
            "translate-x-0": !isChecked,
          },
        )}
      />
    </button>
  );
}; 