import { useState } from "react";
import { Auth } from "common/Auth";
import { Initial } from "./Initial";
import { Signin } from "./Signin";

export function Login() {
  const [state, setState] = useState<"initial" | "signin">("initial");

  return (
    <Auth pageTitle="Login" pageUrl="login">
      <div className="flex flex-col items-center max-w-[544px] p-12">
        {state === "initial" && <Initial onSignin={() => setState("signin")} />}
        {state === "signin" && <Signin />}
      </div>
    </Auth>
  );
}
