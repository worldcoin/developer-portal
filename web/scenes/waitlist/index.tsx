import { Auth } from "common/Auth";
import { useState } from "react";
import { Initial } from "./Initial";
import { Success } from "./Success";

export function WaitList() {
  const [state, setState] = useState<"initial" | "success">("initial");

  return (
    <Auth pageTitle="Join to waitlist" pageUrl="waitlist">
      <div className="flex flex-col items-center max-w-[544px] w-screen p-12 gap-8">
        {state === "initial" && (
          <Initial onSuccess={() => setState("success")} />
        )}
        {state === "success" && <Success />}
      </div>
    </Auth>
  );
}
