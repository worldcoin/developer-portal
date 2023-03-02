import { memo } from "react";
import { FieldInputAddon } from "src/components/LegacyFieldInputAddon";
import { FieldInputAddonAction } from "src/components/FieldInputAddonAction";
import { Icon } from "src/components/Icon";

interface EyeAddonInterface {
  active: boolean;
  onChangeActive: (active: boolean) => void;
}

export const EyeAddon = memo(function EyeAddon(props: EyeAddonInterface) {
  return (
    <FieldInputAddon>
      <FieldInputAddonAction
        onClick={() => props.onChangeActive(!props.active)}
      >
        {!props.active ? (
          <Icon className="w-6 h-6 text-neutral-dark" name="eye-disable" />
        ) : (
          <Icon className="w-6 h-6 text-neutral-dark" name="eye" />
        )}
      </FieldInputAddonAction>
    </FieldInputAddon>
  );
});
