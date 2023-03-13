import { useToggle } from "src/hooks/useToggle";
import {
  KeyboardEvent,
  memo,
  MouseEvent,
  useCallback,
  useEffect,
  useState,
} from "react";
import { VerificationBadges } from "./VerificationBadges";
import cn from "classnames";
import { Icon } from "src/components/Icon";
import { ActionModelWithNullifiers } from "src/lib/models";

const Input = memo(function Input(props: {
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
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
    <div className="grid grid-flow-col gap-x-1 justify-start items-center group">
      <input
        className={cn(
          "min-w-[80px] outline-none font-rubik placeholder:italic",
          {
            "border rounded-lg bg-f3f4f5 border-ebecef": inputButton.isOn,
          },
          { "bg-transparent": !inputButton.isOn },
          props.className
        )}
        placeholder={props.placeholder}
        value={value ?? ""}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onClick={(e) => e.preventDefault()}
        disabled={!inputButton.isOn}
        size={value.length * 0.9}
      />

      {/* FIXME: For some reason button element causes the hydration error */}
      <div onClick={handleButtonClick} className="flex items-center">
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

export const ActionHeader = memo(function ActionHeader(props: {
  action: ActionModelWithNullifiers;
  onChangeName: (value: string) => void;
  onChangeDescription: (value: string) => void;
  open?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (copied) {
      navigator.clipboard.writeText(props.action.action);
      const timeout = setTimeout(() => {
        setCopied(false);
      }, 2000);

      return () => clearTimeout(timeout);
    }
  }, [copied, props.action.action]);

  return (
    <div className={cn("p-4 grid grid-cols-[35%_1fr_auto] gap-x-4")}>
      <div className="grid grid-rows-2 gap-y-1 gap-x-3 grid-flow-col justify-start content-center justify-self-start">
        <div className="p-3 rounded-full bg-primary-light row-span-2 text-0 self-center">
          <Icon name="notepad" className="w-5 h-5 text-primary" />
        </div>

        <Input
          className="font-semibold self-end leading-none pl-1"
          placeholder="Click to set action name"
          value={props.action.name}
          onChange={props.onChangeName}
        />

        <Input
          className="text-12 text-neutral-secondary leading-none pl-0.5"
          placeholder="Click to set description"
          value={props.action.description}
          onChange={props.onChangeDescription}
        />
      </div>

      <div className="grid gap-y-1 justify-items-start items-center content-center">
        <span className="text-[10px] text-neutral-secondary leading-none">
          action
        </span>

        <div className="grid grid-cols-1fr/auto items-center gap-x-2">
          <span className="text-14 font-semibold max-w-full truncate leading-none">
            {props.action.action}
          </span>

          <button
            className="outline-none hover:opacity-80 transition-opacity text-0"
            onClick={(e) => {
              e.stopPropagation();
              setCopied(true);
            }}
          >
            {!copied && <Icon name="copy" className="h-4 w-4 text-primary" />}
            {copied && <Icon name="check" className="h-4 w-4 text-primary" />}
          </button>
        </div>
      </div>

      <div className="grid grid-flow-col items-center justify-end gap-x-16">
        <div className="grid grid-cols-auto/1fr/auto items-center gap-x-2">
          <VerificationBadges
            verifications={props.action.max_accounts_per_user}
          />

          <span className="text-neutral-secondary text-12 font-sora">
            Verifications per person
          </span>

          <span className="font-sora font-semibold text-14">
            {props.action.max_accounts_per_user}
          </span>
        </div>

        <div className="grid grid-cols-1fr/auto items-center gap-x-2">
          <span className="text-neutral-secondary text-12 font-sora">
            Unique persons
          </span>

          <span className="font-sora font-semibold text-14">
            {props.action.nullifiers.length}
          </span>
        </div>

        <Icon
          name="angle-down"
          className={cn("h-6 w-6 transition-transform", {
            "rotate-180": props.open,
          })}
        />
      </div>
    </div>
  );
});
