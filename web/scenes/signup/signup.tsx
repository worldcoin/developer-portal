import { useEffect, useState } from "react";
import { Auth } from "common/Auth";
import { Initial } from "./Initial";
import { Success } from "./Success";
import { useRouter } from "next/router";
import { urls } from "urls";
import { apps } from "common/Layout/temp-data";

export function Signup() {
  const [state, setState] = useState<"initial" | "success">("initial");
  const router = useRouter();

  useEffect(() => {
    const signup_token = localStorage.getItem("signup_token");
    if (!signup_token) {
      router.push(urls.login());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- we want to run this only onces
  }, []);

  return (
    <Auth pageTitle="Sign Up" pageUrl="signup">
      <div className="flex flex-col items-center max-w-[544px] p-12">
        {state === "initial" && (
          <Initial onSuccess={() => setState("success")} />
        )}

        {state === "success" && (
          <Success onContinue={() => router.push(urls.app())} />
        )}
      </div>
    </Auth>
  );
}
