import { apps } from "common/Layout/temp-data";
import { Selector } from "./Selector";
import { memo } from "react";

export const Stats = memo(function Stats() {
  return (
    <section>
      <h2 className="font-sora text-20 font-semibold">Stats</h2>

      <div>
        <Selector options={[{ label: "This week", value: "week" }]} />
      </div>
    </section>
  );
});
