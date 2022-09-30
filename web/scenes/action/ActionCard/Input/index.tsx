import {
  ChangeEvent,
  FormEvent,
  memo,
  useCallback,
  useEffect,
  useState,
} from "react";
import cn from "classnames";
import { Icon } from "common/Icon";
import { useToggle } from "common/hooks";

interface InputInterface {
  className?: string;
  dataValue: string;
  loading?: boolean;
  name: string;
  placeholder?: string;
  updateData?: (payload: { attr: string; value: string }) => void;
}

export const Input = memo(function Input(props: InputInterface) {
  // FIXME `loading` should be used to keep the editable inputs shown but disabled while the update request goes through
  const [value, setValue] = useState<string>("");
  const input = useToggle();

  useEffect(() => {
    setValue(props.dataValue);
  }, [props.dataValue]);

  const handleInput = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setValue(event.target.value);
  }, []);

  const onSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      props.updateData?.({ attr: props.name, value });
    },
    [props, value]
  );

  return (
    <form
      className="grid grid-flow-col gap-x-1 justify-start items-center"
      onSubmit={onSubmit}
      id={`form-${props.name}`}
    >
      <div className="grid">
        <input
          className={cn(
            "w-full col-start-1 row-start-1  py-1 leading-[0] transition-all",
            "outline-none w-auto rounded-xl placeholder:italic row-start-1",
            {
              "border border-d1d3d4 bg-fbfbfb px-4.5": input.isOn,
              "border border-ffffff/0 bg-ffffff/0": !input.isOn,
            },
            props.className
          )}
          type="text"
          onChange={handleInput}
          value={value}
          disabled={!input.isOn}
          name="name"
          id={`action-info-input-${props.name}`}
          placeholder={props.placeholder}
          size={1}
        />

        <span
          className={cn(
            "col-start-1 row-start-1  py-2 leading-none invisible pointer-events-none select-none transition-all",
            {
              "px-6": input.isOn,
              "px-1": !input.isOn,
            },
            props.className
          )}
        >
          {value ? value : props.placeholder}
        </span>
      </div>

      {props.updateData && (
        <div>
          <button
            type="button"
            className={cn(
              "col-start-2 row-start-1 text-0 outline-none hover:opacity-60 transition-opacity",
              { "invisible opacity-0 pointer-events-none": input.isOn }
            )}
            onClick={input.toggleOn}
          >
            <Icon name="edit" className="w-6 h-6" />
          </button>

          <button
            type="submit"
            className={cn(
              "col-start-2 row-start-1 text-0 outline-none hover:opacity-60 transition-opacity",
              { "invisible opacity-0 pointer-events-none": !input.isOn }
            )}
            onClick={input.toggleOff}
            disabled={props.loading}
          >
            <Icon name="check" className="w-6 h-6" />
          </button>
        </div>
      )}
    </form>
  );
});
