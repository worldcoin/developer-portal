import cn from "classnames";
import { ChangeEvent, KeyboardEvent, useCallback, useState } from "react";
import { FieldInput } from "src/components/FieldInput";
import { validateUrl } from "src/lib/utils";

interface UrlInputProps {
  value: string;
  onChange: (value: string) => void;
}

export function UrlInput(props: UrlInputProps) {
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
    <FieldInput
      className={cn("w-full", { "border-danger/75": !valid })}
      value={value}
      onChange={handleChange}
      onBlur={submit}
      onKeyDown={handleKeyboard}
    />
  );
}
