import { FieldGroup } from "common/FieldGroup";
import { FieldInput } from "common/FieldInput";
import { memo } from "react";

export const Details = memo(function Details() {
  return (
    <div className="grid gap-y-12">
      <h2 className="font-semibold font-sora">My Team Details</h2>

      <FieldGroup label="Team name">
        <FieldInput value="Worldcoin" />
      </FieldGroup>
    </div>
  );
});
