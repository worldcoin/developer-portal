import { memo } from "react";
import { Option } from "./Option";

export interface EngineSwitchProps {
  value: "cloud" | "on-chain";
  onChange: (value: "cloud" | "on-chain") => void;
}

export const EngineSwitch = memo(function EngineSwitch(
  props: EngineSwitchProps
) {
  const { value, onChange } = props;

  return (
    <div className="grid gap-y-3 mt-6">
      <Option
        icon="cloud"
        title="Cloud"
        description="For actions that are triggered with the API or Sign in with World ID."
        easiest
        checked={value === "cloud"}
        onCheckedChange={() => onChange("cloud")}
      />

      <Option
        icon="on-chain"
        title="On-chain"
        description="For actions that are validated and executed on chain."
        checked={value === "on-chain"}
        onCheckedChange={() => onChange("on-chain")}
      />
    </div>
  );
});
