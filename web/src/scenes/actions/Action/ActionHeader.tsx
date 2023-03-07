import { useToggle } from "src/hooks/useToggle";
import { memo, useCallback, useState } from "react";
import { VerificationBadges } from "./VerificationBadges";
import cn from "classnames";
import { Icon } from "src/components/Icon";
import { CustomAction } from "src/components/Layout/temp-data";

const Input = memo(function Input(props: {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  save?: () => void;
  lengthAdjust?: number;
}) {
  const inputButton = useToggle();

  const handleButtonClick = useCallback(() => {
    if (!inputButton.isOn) {
      return inputButton.toggleOn();
    }

    props.save?.();
    inputButton.toggleOff();
  }, [inputButton, props]);

  return (
    <div className="grid grid-flow-col gap-x-1 justify-start items-center">
      <input
        className={cn(
          "min-w-[80px] outline-none",
          {
            "border rounded-lg bg-f3f4f5 border-ebecef": inputButton.isOn,
          },
          { "bg-transparent": !inputButton.isOn },
          props.className
        )}
        value={props.value ?? ""}
        onChange={(e) => props.onChange(e.target.value)}
        disabled={!inputButton.isOn}
        size={props.value.length + (props.lengthAdjust ?? 0)}
      />

      {/* FIXME: For some reason button element causes the hydration error */}
      <div onClick={handleButtonClick} className="flex items-center group">
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
  action: CustomAction;
  open?: boolean;
}) {
  const [nameInput, setNameInput] = useState(props.action.name);

  const [descriptionInput, setDescriptionInput] = useState(
    props.action.description
  );

  return (
    <div className={cn("p-4 flex justify-between items-center")}>
      <div className="grid grid-rows-2 gap-y-1 gap-x-3 grid-flow-col justify-start content-center">
        <div className="p-3 rounded-full bg-primary-light row-span-2 text-0 self-center">
          <Icon name="notepad" className="w-5 h-5 text-primary" />
        </div>

        <Input
          className="font-sora font-semibold self-end leading-none pl-1"
          value={nameInput}
          onChange={setNameInput}
        />

        <Input
          className="text-12 text-neutral-secondary leading-none pl-0.5"
          value={descriptionInput}
          onChange={setDescriptionInput}
          lengthAdjust={-2}
        />
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
