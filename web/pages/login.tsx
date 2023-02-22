import { ISuccessResult } from "@worldcoin/idkit";
import { useAuthContext } from "contexts/AuthContext";
import { setCookie } from "cookies-next";
import { useRouter } from "next/router";
import { useCallback } from "react";
import { LoginRequestBody, LoginResponse } from "./api/login";

const Login = () => {
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

  return (
    <div>
      <button
        type="button"
        onClick={() =>
          onSuccess({
            signal_type: "orb",
            proof_payload: {
              merkle_root: "0x123",
              proof: "0x321",
            },
            nullifier_hash: "0x123",
            external_nullifier: "0x123",
          })
        }
      >
        Send success
      </button>
    </div>
  );
};

export default Login;
