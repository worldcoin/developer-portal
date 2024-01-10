import { FieldSelect } from "@/components/FieldSelect";
import { memo, useCallback, useEffect, useRef } from "react";
import { Icon } from "@/components/Icon";

export const Dropdown = memo(function Dropdown(props: {
  label: string;
  options: Array<{ value: string; label: string }>;
  selectedValue: string;
  onChange: (value: string) => void;
  saving?: boolean;
  disabled?: boolean;
  disabledMessage?: string;
}) {
  const { selectedValue, onChange, disabled } = props;

  const ref = useRef<HTMLSelectElement | null>(null);

  const handleChange = useCallback(() => {
    const newValue = ref.current?.value;
    if (newValue && newValue !== selectedValue) {
      onChange(newValue);
    }
  }, [selectedValue, onChange]);

  // Update the select value when the selectedValue prop changes
  useEffect(() => {
    if (ref.current) {
      ref.current.value = selectedValue;
    }
  }, [selectedValue]);

  return (
    <label>
      <span className="text-14 font-medium ">{props.label}</span>
      <div className="relative group">
        <FieldSelect
          ref={ref}
          className="text-14 disabled:cursor-not-allowed bg-gray-100"
          value={selectedValue}
          onChange={handleChange}
          disabled={disabled}
          options={props.options}
        />
        {props.saving && (
          <Icon
            className="absolute right-0 top-1/2 -mt-2 mr-2 w-4 h-4 animate-spin"
            name="spinner"
            noMask
          />
        )}
        {disabled && props.disabledMessage && (
          <div className="absolute invisible group-hover:visible top-[100%] mt-1 text-14 text-neutral-secondary">
            {props.disabledMessage}
          </div>
        )}
      </div>
    </label>
  );
});
