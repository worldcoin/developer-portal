import { useCallback } from "react";
import { Auth } from "common/Auth";
import { useRouter } from "next/router";
import { useAuthContext } from "contexts/AuthContext";
import { LoginRequestBody, LoginResponse } from "pages/api/login";
import { Illustration } from "common/Auth/Illustration";
import { Typography } from "common/Auth/Typography";
import { Button } from "common/Auth/Button";
import { Icon } from "common/Icon";
import { ISuccessResult } from "@worldcoin/idkit";
import dayjs from "dayjs";
import { urls } from "urls";
import { ILoginPageProps } from "pages/login";

export function Login({ loginUrl }: ILoginPageProps) {
  const router = useRouter();
  const { setToken, enterApp } = useAuthContext();
  const signal = dayjs().unix().toString();

  console.log(loginUrl);

  const handleVerify = useCallback(
    (result: ISuccessResult) => {
      const { proof, merkle_root, nullifier_hash, credential_type } = result;

      //NOTE: After this fetch user will be redirected to /register or to dashboard.
      fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          proof,
          nullifier_hash,
          merkle_root,
          credential_type,
          signal,
        } as LoginRequestBody),
      })
        .then((res) => res.json())
        .then((result: LoginResponse) => {
          if (!Object.hasOwn(result, "new_user")) {
            return console.error("Error while logging in.");
          }

          if (result.new_user && result.signup_token) {
            sessionStorage.setItem("tempSignupToken", result.signup_token);
            router.push(urls.signup());
          }

          if (!result.new_user && result.token) {
            setToken(result.token);
            enterApp();
          }
        })
        .catch((err) => {
          console.error(err);
        });
    },
    [enterApp, router, setToken, signal]
  );

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
        <Button className="max-w-[327px] w-full h-[64px] mt-8 font-medium">
          Join the Waitlist
        </Button>
        <a className="w-full" href={loginUrl}>
          <Button className="max-w-[327px] w-full h-[64px] mt-8 font-medium">
            <Icon name="wld-sign-in" className="w-[30px] h-[30px] mr-3" />
            Sign in with World ID
          </Button>
        </a>
        <div className="flex gap-x-2 mt-6 font-rubik text-14 text-neutral-secondary">
          Don&apos;t have World ID?
          <a
            className="text-primary hover:text-primary/80"
            href="https://worldcoin.org/download"
            target="_blank"
            rel="noopener noreferrer"
          >
            Download the World App
          </a>
        </div>
      </div>
    </Auth>
  );
}
