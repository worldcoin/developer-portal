import { KeyboardEvent, memo, MouseEvent, useCallback, useState } from "react";
import cn from "classnames";
import AutosizeInput from "react-input-autosize";
import { Icon } from "@/components/Icon";
import { useToggle } from "@/hooks/useToggle";

export const Input = memo(function Input(props: {
  className?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const [value, setValue] = useState(props.value);
  const inputButton = useToggle();

  const handleButtonClick = useCallback(
    (e: MouseEvent | KeyboardEvent<HTMLInputElement>) => {
      e.preventDefault();
      if (!inputButton.isOn) {
        return inputButton.toggleOn();
      }

      props.onChange(value);
      inputButton.toggleOff();
    },
    [inputButton, props, value]
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      e.stopPropagation();
      if (e.key === "Enter") {
        handleButtonClick(e);
      }
    },
    [handleButtonClick]
  );

  return (
    <div className="group flex items-center h-4 gap-x-1">
      <AutosizeInput
        className="h-4 !inline-flex"
        inputClassName={cn(
          "outline-none border font-rubik text-14 leading-4 placeholder:italic",
          {
            "px-2 bg-f3f4f5 border-ebecef rounded-md": inputButton.isOn,
            "bg-transparent border-transparent": !inputButton.isOn,
          }
        )}
        placeholder={props.placeholder}
        value={value ?? ""}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onClick={(e) => e.preventDefault()}
        readOnly={!inputButton.isOn}
      />
      <div className="flex h-4 cursor-pointer" onClick={handleButtonClick}>
        <Icon
          name={inputButton.isOn ? "check" : "edit"}
          className={cn(
            "h-4 w-4",
            {
              "text-primary-light group-hover:text-primary transition-colors":
                !inputButton.isOn,
            },
            { "text-primary": inputButton.isOn }
          )}
        />
      </div>
    </div>
  );
});
