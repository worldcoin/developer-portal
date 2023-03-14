import { useRouter } from "next/router";
import { useCallback, useEffect, useState } from "react";
import { Auth } from "src/components/Auth";
import { Button } from "src/components/Auth/Button";
import { Illustration } from "src/components/Auth/Illustration";
import { Typography } from "src/components/Auth/Typography";
import { Icon } from "src/components/Icon";
import { Spinner } from "src/components/Spinner";
import { urls } from "src/lib/urls";
import { LoginRequestBody, LoginRequestResponse } from "src/pages/api/login";
import { ILoginPageProps } from "src/pages/login";

const canDevLogin = Boolean(process.env.NEXT_PUBLIC_DEV_LOGIN_KEY);

export function Login({ loginUrl }: ILoginPageProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const doLogin = useCallback(
    async (body: LoginRequestBody) => {
      setLoading(true);
      // NOTE: After this fetch user will be redirected to /register or to dashboard.
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      const payload = (await response.json()) as LoginRequestResponse;

      if (!Object.hasOwn(payload, "new_user")) {
        router.push(`${urls.login()}?error=invalid_login`);
        return;
      }

      if (payload.new_user && payload.signup_token) {
        localStorage.setItem("signup_token", payload.signup_token);
        return router.push(`${urls.waitlist()}`);
        // return router.push(urls.signup());
      }

      if (!payload.new_user && payload.returnTo) {
        return router.push(payload.returnTo);
      }

      router.push(urls.app());
    },
    [router]
  );

  useEffect(() => {
    if (router.isReady) {
      setLoading(false);
      if (router.query.id_token) {
        doLogin({
          sign_in_with_world_id_token: router.query.id_token as string,
        });
      }

      if (router.query.error) {
        setError(true);
      }
    }
  }, [router, doLogin]);

  return (
    <Auth pageTitle="Login" pageUrl="login">
      {error && (
        <div className="bg-danger-light px-6 py-4 rounded-md text-danger font-medium">
          There was a problem with your login. Please try again.
        </div>
      )}
      <div className="flex flex-col items-center max-w-[544px] p-12">
        <Illustration icon="user-solid" />
        <Typography className="max-w-[320px] mt-8" variant="title">
          World ID is&nbsp;currently in&nbsp;beta
        </Typography>
        <Typography className="mt-2" variant="subtitle">
          Sign in with World ID or join our waitlist
        </Typography>
        {loading && <Spinner className="mt-4" />}
        {!loading && (
          <>
            <a className="w-full" href="https://docs.worldcoin.org/waitlist">
              <Button className="max-w-[327px] w-full h-[64px] mt-8 font-medium">
                Join the Waitlist
              </Button>
            </a>
            <a className="w-full" href={loginUrl}>
              <Button className="max-w-[327px] w-full h-[64px] mt-8 font-medium">
                <Icon name="wld-sign-in" className="w-[30px] h-[30px] mr-3" />
                Sign in with Worldcoin
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

            {canDevLogin && (
              <div className="bg-warning-light px-6 py-4 rounded-md text-warning font-medium mt-10 max-w-[327px] w-full text-center">
                Dev mode!{" "}
                <span
                  className="cursor-pointer underline font-normal"
                  onClick={() => {
                    doLogin({
                      dev_login: process.env.NEXT_PUBLIC_DEV_LOGIN_KEY,
                    });
                  }}
                >
                  Log in with test user
                </span>
              </div>
            )}
          </>
        )}
      </div>
    </Auth>
  );
}
