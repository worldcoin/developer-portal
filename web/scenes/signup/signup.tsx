import { useState } from "react";
import { Auth } from "common/Auth";
import { Initial } from "./Initial";
import { Success } from "./Success";

export function Signup() {
  const [state, setState] = useState<"initial" | "success">("initial");

  return (
    <Auth pageTitle="Sign Up" pageUrl="signup">
      <div className="flex flex-col items-center max-w-[544px] p-12">
        {state === "initial" && (
          <Initial onSuccess={() => setState("success")} />
        )}

        {state === "success" && (
          <Success onContinue={() => setState("success")} />
        )}
      </div>
    </Auth>
  );
}
