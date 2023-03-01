import classNames from "classnames";
import {
  Dispatch,
  KeyboardEvent,
  SetStateAction,
  useCallback,
  useRef,
  useState,
} from "react";

interface TagsPropsInterface {
  value: Array<string>;
  onChange: Dispatch<SetStateAction<Array<string>>>;
  validate: (value: string) => boolean;
  disabled?: boolean;
}

export function TagsField(props: TagsPropsInterface) {
  const [invalid, setInvalid] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleKeyboard = useCallback(
    (e: KeyboardEvent) => {
      const input = inputRef.current;

      if (!input) {
        return;
      }

      // NOTE: delete last
      if (e.key === "Backspace" && input?.value === "") {
        props.onChange((prevValue) => {
          const newValue = [...prevValue];
          newValue.splice(-1);
          return newValue;
        });
      }

      // NOTE: if press , or Enter
      if (e.key === "," || e.key === "Enter" || e.key == " ") {
        e.preventDefault();
        if (props.validate(input.value)) {
          const value = input.value;
          props.onChange((prevValue) => [...prevValue, value]);
          input.value = "";
        } else {
          setInvalid(true);
          setTimeout(() => setInvalid(false), 2500);
        }
      }
    },
    [props]
  );

  return (
    <div
      className={classNames(
        "flex flex-wrap gap-1 border-2 py-2 px-2 rounded-[10px] transition-colors",
        { "border-neutral-secondary": !invalid, "border-warning": invalid }
      )}
    >
      {props.value.map((item, idx) => (
        <span className="px-2 py-1 text-14 rounded-lg bg-f3f4f5" key={idx}>
          {item}
        </span>
      ))}

      <input
        type="text"
        onKeyDown={handleKeyboard}
        ref={inputRef}
        className="outline-none disabled:opacity-0"
        placeholder={
          props.value.length <= 0 ? "Email, comma separates invite" : ""
        }
        disabled={props.disabled}
      />
    </div>
  );
}
