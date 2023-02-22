import { useAuthContext } from "contexts/AuthContext";
import { setCookie } from "cookies-next";
import { useRouter } from "next/router";
import { useCallback, useState } from "react";
import { SignupRequestBody, SignupResponse } from "./api/signup";

const Register = () => {
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
    <div>
      <form onSubmit={submit} className="grid max-w-xs">
        <input
          className="border"
          type="text"
          id=""
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="email"
        />
        <input
          type="text"
          className="border"
          id=""
          value={teamName}
          onChange={(e) => setTeamName(e.target.value)}
          placeholder="team name"
        />
        <button type="submit">Submit</button>
      </form>
    </div>
  );
};
export default Register;
