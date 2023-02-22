import { useCallback, useState } from "react";
import { Auth } from "common/Auth";
import { Initial } from "./Initial";
import { Success } from "./Success";
import { useRouter } from "next/router";
import { useAuthContext } from "contexts/AuthContext";
import { SignupRequestBody, SignupResponse } from "pages/api/signup";

export function Signup() {
  const [state, setState] = useState<"initial" | "success">("initial");

  const [email, setEmail] = useState("");
  const [teamName, setTeamName] = useState("");
  const router = useRouter();
  const { setToken } = useAuthContext();

  const submit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const tempToken = sessionStorage.getItem("tempSignupToken");

      fetch("/api/signup", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          email,
          teamName,
          tempToken,
        } as SignupRequestBody),
      })
        .then((res) => res.json())
        .then((data: SignupResponse) => {
          setToken(data.token);
          router.push("/dashboard");
        });
    },
    [email, router, setToken, teamName]
  );

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
