import { memo } from "react";
import { Field as ActionField } from "src/scenes/action/ActionHeader/Field";

export const Kiosk = memo(function Kiosk(props: { url?: string }) {
  return (
    <div>
      <div className="font-medium text-14 leading-4">Kiosk URL</div>
      <ActionField
        className="mt-2 text-14 leading-4"
        valueClassName="truncate"
        value={props.url ?? ""}
        copyable
      />
    </div>
  );
});
