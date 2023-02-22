import { useCallback, useState } from "react";
import { Auth } from "common/Auth";
import { useRouter } from "next/router";
import { useAuthContext } from "contexts/AuthContext";
import { LoginRequestBody, LoginResponse } from "pages/api/login";
import { Illustration } from "common/Auth/Illustration";
import { Typography } from "common/Auth/Typography";
import { Button } from "common/Auth/Button";
import { Icon } from "common/Icon";

export function Login() {
  const [state, setState] = useState<"initial" | "signin">("initial");

  const router = useRouter();
  const { token, setToken, enterApp } = useAuthContext();
  console.log("login token: ", { token });

  //FIXME: Just a mock for now
  //ANCHOR: Some success function that will be passed to the IDKit
  const onSuccess = useCallback(
    (result: {
      signal_type: string;
      proof_payload: { merkle_root: string; proof: string };
      nullifier_hash: string;
      external_nullifier: string;
    }) => {
      const { signal_type, proof_payload, nullifier_hash, external_nullifier } =
        result;

      //NOTE: After this fetch user will be redirected to /register or to dashboard.
      fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          proof: proof_payload.proof,
          nullifier_hash,
          merkle_root: proof_payload.merkle_root,
          signal_type,
          signal: "test",
          external_nullifier,
        } as LoginRequestBody),
      })
        .then((res) => res.json())
        .then((result: LoginResponse) => {
          if (!result.token && !result.tempToken) {
            return console.error("Error while logging in.");
          }

          if (result.tempToken) {
            sessionStorage.setItem("tempSignupToken", result.tempToken);
            router.push("/signup");
          }

          if (result.token) {
            setToken(result.token);
            enterApp();
          }
        })
        .catch((err) => {
          console.error(err);
        });
    },
    [enterApp, router, setToken]
  );

  // FIXME: Just a mock for now
  const handleFakeSuccess = () => {
    onSuccess({
      signal_type: "orb",
      proof_payload: {
        merkle_root: "0x123",
        proof: "0x321",
      },
      nullifier_hash: "0x123",
      external_nullifier: "0x123",
    });
  };

  return (
    <Auth pageTitle="Login" pageUrl="login">
      <div className="flex flex-col items-center max-w-[544px] p-12">
        <Illustration icon="user-solid" />

        <Typography className="max-w-[320px] mt-8" variant="title">
          World ID is&nbsp;currently in&nbsp;beta
        </Typography>

        <Typography className="mt-2" variant="subtitle">
          Sign in with World ID or join our waitlist
        </Typography>

        <Button
          className="max-w-[327px] w-full h-[64px] mt-8 font-medium"
          onClick={handleFakeSuccess}
        >
          <Icon name="wld-signin" className="w-[30px] h-[30px] mr-3" />
          Sign in with World ID
        </Button>

        <div className="flex gap-x-2 mt-6 font-rubik text-14 text-neutral-secondary">
          Don’t have World ID?
          <a
            className="text-primary hover:text-primary/80"
            href="#" // FIXME: Add link
          >
            Download the World App
          </a>
        </div>
      </div>
    </Auth>
  );
}
