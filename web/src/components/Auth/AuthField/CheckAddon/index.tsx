import { memo, useContext } from "react";
import { FieldInputContext } from "src/components/LegacyFieldInput";
import { FieldInputAddon } from "src/components/LegacyFieldInputAddon";
import { FieldInputAddonAction } from "src/components/FieldInputAddonAction";
import { Icon } from "src/components/Icon";

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
