import { memo, useContext } from "react";
import { FieldInputContext } from "common/FieldInput";
import { FieldInputAddon } from "common/FieldInputAddon";
import { FieldInputAddonAction } from "common/FieldInputAddonAction";
import { Icon } from "common/Icon";

export const CheckAddon = memo(function CheckAddon() {
  const context = useContext(FieldInputContext);

  if (!context.value) {
    return null;
  }

  return (
    <FieldInputAddon>
      <FieldInputAddonAction>
        <Icon className="w-6 h-6 text-success" name="check" />
      </FieldInputAddonAction>
    </FieldInputAddon>
  );
});
