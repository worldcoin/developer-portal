import { memo } from "react";
import { EngineType } from "src/lib/types";
import { Option } from "./Option";

export interface EngineSwitchProps {
  value: EngineType;
  onChange: (value: EngineType) => void;
  disabled?: boolean;
}

export const EngineSwitch = memo(function EngineSwitch(
  props: EngineSwitchProps
) {
  const { value, onChange, disabled } = props;

  return (
    <div className="grid gap-y-3 mt-6">
      <Option
        icon="cloud"
        title="Cloud"
        description="For actions that are triggered with the API or Sign in with World ID."
        easiest
        checked={value === EngineType.Cloud}
        onCheckedChange={() => onChange(EngineType.Cloud)}
        disabled={disabled}
      />

      <Option
        icon="on-chain"
        title="On-chain"
        description="For actions that are validated and executed on the blockchain."
        checked={value === EngineType.OnChain}
        onCheckedChange={() => onChange(EngineType.OnChain)}
        disabled={disabled}
      />
    </div>
  );
});
