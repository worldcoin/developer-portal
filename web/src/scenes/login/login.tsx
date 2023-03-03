import { useCallback, useEffect, useState } from "react";
import { Auth } from "src/components/Auth";
import { useRouter } from "next/router";
import { LoginRequestBody } from "src/pages/api/login";
import { Illustration } from "src/components/Auth/Illustration";
import { Typography } from "src/components/Auth/Typography";
import { Button } from "src/components/Auth/Button";
import { Icon } from "src/components/Icon";
import { urls } from "src/lib/urls";
import { ILoginPageProps } from "src/pages/login";
import { Spinner } from "src/components/Spinner";
import useAuth from "src/hooks/useAuth";
import { IAuthStore, useAuthStore } from "src/stores/authStore";
import { shallow } from "zustand/shallow";

const getParams = (store: IAuthStore) => ({
  setToken: store.setToken,
  enterApp: store.enterApp,
});

export function Login({ loginUrl, devToken }: ILoginPageProps) {
  const router = useRouter();
  const { setToken, enterApp } = useAuthStore(getParams, shallow);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const { isAuthenticated } = useAuth();

  const doLogin = useCallback(
    async (token: string) => {
      setLoading(true);
      // NOTE: After this fetch user will be redirected to /register or to dashboard.
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sign_in_with_world_id_token: token,
        } as LoginRequestBody),
      });
      const payload = await response.json();
      if (!Object.hasOwn(payload, "new_user")) {
        router.push(`${urls.login()}?error=invalid_login`);
        return;
      }

      if (payload.new_user && payload.signup_token) {
        localStorage.setItem("signup_token", payload.signup_token);
        router.push(urls.signup());
      }

      if (!payload.new_user && payload.token) {
        setToken(payload.token);
        enterApp(router);
      }
    },
    [router, setToken, enterApp, setLoading]
  );

  useEffect(() => {
    if (router.isReady) {
      setLoading(false);
      if (router.query.id_token) {
        doLogin(router.query.id_token as string);
      }

      if (router.query.error) {
        setError(true);
      }
    }
  }, [router, doLogin]);

  useEffect(() => {
    if (isAuthenticated) {
      enterApp(router);
    }
  }, [isAuthenticated, enterApp, router]);

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

            {devToken && (
              <div className="bg-warning-light px-6 py-4 rounded-md text-warning font-medium mt-10 max-w-[327px] w-full text-center">
                Dev mode!{" "}
                <span
                  className="cursor-pointer underline font-normal"
                  onClick={() => {
                    setToken(devToken);
                    enterApp(router);
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
