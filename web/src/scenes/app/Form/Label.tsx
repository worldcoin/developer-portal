import { FieldInput } from "@/components/FieldInput";
import { KeyboardEvent, memo, useCallback, useEffect, useRef } from "react";
import { Icon } from "@/components/Icon";

export const Label = memo(function Label(props: {
  label: string;
  value: string;
  saving?: boolean;
  onSave: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  disabledMessage?: string;
}) {
  const { value, onSave, disabled, placeholder } = props;

  const ref = useRef<HTMLInputElement | null>(null);

  const handleSave = useCallback(() => {
    const newValue = ref.current?.value;
    if (newValue && newValue !== value) {
      onSave(newValue);
    }
  }, [value, onSave]);

  const handleBlur = useCallback(() => {
    handleSave();
  }, [handleSave]);

  const handleKeyPress = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        handleSave();
      }
    },
    [handleSave]
  );

  // Update the input value when the value prop changes
  useEffect(() => {
    if (ref.current) {
      ref.current.value = value;
    }
  }, [value]);

  return (
    <label>
      <span className="text-14 font-medium">{props.label}</span>
      <div className="relative group">
        <FieldInput
          ref={ref}
          className="text-14 w-full disabled:cursor-not-allowed"
          defaultValue={value}
          placeholder={placeholder}
          onBlur={handleBlur}
          onKeyPress={handleKeyPress}
          disabled={disabled}
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
