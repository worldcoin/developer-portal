import { ISuccessResult } from "@worldcoin/idkit";
import { useRouter } from "next/router";
import { LoginRequestBody } from "./api/login";

const Login = () => {
  const router = useRouter();

  //FIXME: Just a mock for now
  //ANCHOR: Some success function that will be passed to the IDKit
  const onSuccess = (result: {
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
      .then((result) => {
        if (!result.redirectTo) {
          return console.error("Error while logging in.");
        }

        router.push(
          {
            pathname: result.redirectTo,
            query: { ...result.data },
          },
          result.redirectTo
        );
      })
      .catch((err) => {
        console.error(err);
      });
  };

  console.log(onSuccess);

  return (
    <div>
      <button
        type="button"
        onClick={() =>
          onSuccess({
            signal_type: "orb",
            proof_payload: {
              merkle_root: "0x123",
              proof: "0x123",
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
