import {
  memo,
  useCallback,
  useEffect,
  useState,
  useRef,
  ChangeEvent,
  FormEvent,
  KeyboardEvent,
} from "react";
import { useToggle } from "hooks/useToggle";
import cn from "classnames";
import { Icon } from "common/Icon";

interface InputInterface {
  className?: string;
  valueClassName?: string;
  name: string;
  placeholder?: string;
  value: string;
  updateData: (payload: { attr: string; value: string }) => void;
}

export const Input = memo(function Input(props: InputInterface) {
  const [value, setValue] = useState<string>(props.value);
  const inputRef = useRef<HTMLInputElement>(null);
  const input = useToggle();

  useEffect(() => {
    setValue(props.value);
  }, [props.value]);

  const handleInput = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setValue(event.target.value);
  }, []);

  const handleOn = useCallback(() => {
    input.toggleOn();
    inputRef.current?.focus();
  }, [input]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Escape") {
        input.toggleOff();
      }
    },
    [input]
  );

  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      props.updateData({ attr: props.name, value });
    },
    [props, value]
  );

  return (
    <form
      id={`form-${props.name}`}
      className={cn(
        "grid grid-flow-col gap-x-1 justify-start items-center",
        props.className
      )}
      onSubmit={handleSubmit}
    >
      <div className="relative">
        <input
          ref={inputRef}
          className={cn(
            "absolute w-full block font-rubik leading-[0px]",
            "transition-all outline-none rounded",
            { "px-4 border border-neutral-muted bg-fbfbfb": input.isOn },
            { "border border-ffffff/0 bg-ffffff/0": !input.isOn },
            props.valueClassName
          )}
          name="name"
          placeholder={props.placeholder}
          value={value}
          onChange={handleInput}
          readOnly={!input.isOn}
          onKeyDown={handleKeyDown}
        />
        <pre
          className={cn(
            "block font-rubik border invisible",
            { "px-4": input.isOn },
            props.valueClassName
          )}
        >
          {value ? value : props.placeholder}
        </pre>
      </div>
      <div className="grid grid-flow-col items-center">
        {!input.isOn && (
          <button
            className="grid grid-flow-col items-center"
            type="button"
            onClick={handleOn}
          >
            <Icon name="edit-alt" className="w-4 h-4 text-primary" />
          </button>
        )}
        <button
          className={cn("grid grid-flow-col items-center", {
            invisible: !input.isOn,
          })}
          type="submit"
          onClick={input.toggleOff}
        >
          <Icon name="check" className="w-4 h-4 text-primary" />
        </button>
      </div>
    </form>
  );
});
