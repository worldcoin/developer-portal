import { FieldGroup } from "@/components/FieldGroup";
import { FieldInput } from "@/components/FieldInput";
import { memo, useState } from "react";

export const Details = memo(function Details() {
  const [name, setName] = useState("Worldcoin");

  return (
    <div className="grid gap-y-12">
      <h2 className="font-semibold font-sora">My Team Details</h2>

      <FieldGroup label="Team name">
        <FieldInput value={name} onChange={(e) => setName(e.target.value)} />
      </FieldGroup>
    </div>
  );
});
