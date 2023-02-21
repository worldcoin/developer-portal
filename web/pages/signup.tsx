import { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import { useCallback, useMemo, useState } from "react";
import { LoginRequestBody, SignupInternalData } from "./api/login";

const Register = () => {
  const router = useRouter();

  const data = useMemo(
    () => router.query as SignupInternalData,
    [router.query]
  );

  const [email, setEmail] = useState("");
  const [teamName, setTeamName] = useState("");

  const submit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      if (!data) {
        return;
      }

      const result = await fetch("/api/signup", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          email,
          teamName,
          ...data,
        }),
      });

      console.log(result);
    },
    [data, email, teamName]
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
