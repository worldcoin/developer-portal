import { FieldCheckbox } from "@/components/FieldCheckbox";
import { memo, useCallback, useEffect, useRef } from "react";
import { Icon } from "@/components/Icon";

export const Checkbox = memo(function Checkbox(props: {
  label: string;
  checked: boolean;
  saving?: boolean;
  onToggle: (checked: boolean) => void;
  disabled?: boolean;
  disabledMessage?: string;
}) {
  const { checked, onToggle, disabled, saving, disabledMessage, label } = props;

  const ref = useRef<HTMLInputElement | null>(null);

  const handleToggle = useCallback(() => {
    if (ref.current) {
      onToggle(ref.current.checked);
    }
  }, [onToggle]);

  // Update the checkbox checked state when the checked prop changes
  useEffect(() => {
    if (ref.current) {
      ref.current.checked = checked;
    }
  }, [checked]);

  return (
    <label className="flex items-center space-x-2">
      <FieldCheckbox
        ref={ref}
        checked={checked}
        onChange={handleToggle}
        disabled={disabled}
      />
      
      <span className="text-14 font-medium">{label}</span>
      {saving && (
        <Icon className="w-4 h-4 animate-spin" name="spinner" noMask />
      )}
      {disabled && disabledMessage && (
        <div className="text-14 text-neutral-secondary">{disabledMessage}</div>
      )}
    </label>
  );
});
