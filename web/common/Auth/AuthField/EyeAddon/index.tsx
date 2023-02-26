import { memo } from "react";
import { FieldInputAddon } from "common/LegacyFieldInputAddon";
import { FieldInputAddonAction } from "common/FieldInputAddonAction";
import { Icon } from "common/Icon";

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
