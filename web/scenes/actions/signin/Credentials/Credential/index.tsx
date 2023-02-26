import { Icon } from "common/Icon";
import { memo } from "react";
import cn from "classnames";
import { Button } from "common/Button";

export const Credential = memo(function Credential(props: {
  name: string;
  value: string;
  valueHidden?: boolean;
  buttons: Array<{
    text: string;
    action: () => void;
  }>;
}) {
  return (
    <div className="grid gap-y-2 justify-start">
      <span className="text-12 font-semibold uppercase">{props.name}</span>
      <div className="text-neutral-secondary">
        {!props.valueHidden && props.value && <span>{props.value}</span>}

        {(props.valueHidden || !props.value) && (
          <div className="grid grid-cols-auto/1fr justify-start items-center gap-x-2">
            <Icon name="lock" className="w-4 h-4" />
            <span>Locked</span>
          </div>
        )}
      </div>

      <div className="grid gap-x-2 grid-flow-col justify-start">
        {props.buttons.map((button, index) => (
          <Button
            key={`signin-credential-button-${props.name}-${index}`}
            onClick={button.action}
            variant="secondary"
            className="px-4 py-2.5"
          >
            {button.text}
          </Button>
        ))}
      </div>
    </div>
  );
});
