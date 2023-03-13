import cn from "classnames";
import { useCallback, useState, KeyboardEvent, ChangeEvent } from "react";
import { FieldInput } from "src/components/FieldInput";
import { Icon } from "src/components/Icon";
import { validateUrl } from "src/lib/utils";

interface RedirectInputProps {
  value: string;
  onChange: (value: string) => void;
  onDelete: () => void;
}

export function RedirectInput(props: RedirectInputProps) {
  const [valid, setValid] = useState(true);
  const [value, setValue] = useState(props.value);

  const submit = useCallback(() => {
    if (valid) {
      props.onChange(value);
    }
  }, [props, valid, value]);

  const handleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
    setValid(validateUrl(e.target.value));
  }, []);

  const handleKeyboard = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" || e.key === "Tab") {
        submit();
      }
    },
    [submit]
  );

  return (
    <div className="grid grid-cols-1fr/auto gap-x-2 items-center">
      <FieldInput
        className={cn("w-full", { "border-danger/75": !valid })}
        value={value}
        onChange={handleChange}
        onBlur={submit}
        onKeyDown={handleKeyboard}
      />

      <button type="button" onClick={props.onDelete} className="text-0 group">
        <Icon
          name="close"
          className="w-6 h-6 bg-neutral-secondary group-hover:bg-neutral-dark transition-colors"
        />
      </button>
    </div>
  );
}
