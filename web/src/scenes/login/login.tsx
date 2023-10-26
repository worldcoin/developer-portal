import { useRouter } from "next/router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Auth } from "src/components/Auth";
import { Button } from "src/components/Button";
import { Icon } from "src/components/Icon";
import { Link } from "src/components/Link";
import { Spinner } from "src/components/Spinner";
import { urls } from "src/lib/urls";
import { LoginRequestBody, LoginRequestResponse } from "src/pages/api/login";
import { ILoginPageProps } from "src/pages/login";
import Image from "next/image";
import torShape from "public/images/tor-shape.svg";
import cn from "classnames";

const canDevLogin = Boolean(process.env.NEXT_PUBLIC_DEV_LOGIN_KEY);

export function Login({ loginUrl, error }: ILoginPageProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [loginError, setLoginError] = useState(false);
  const { asPath } = useRouter();

  const id_token = useMemo(() => {
    const params = new URLSearchParams(asPath.split("#")[1]);
    return params.get("id_token");
  }, [asPath]);

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

      // Invalid login response, show an error page
      if (!response.ok && "code" in payload) {
        return router.push(
          `${urls.login()}?error=${payload.code ?? "login_failed"}`
        );
      }

      // User has a signup token, redirect to signup page
      if ("new_user" in payload && payload.new_user && payload.signup_token) {
        localStorage.setItem("signup_token", payload.signup_token);
        return router.push(
          `${urls.signup()}${
            payload.email ? `?email=${encodeURIComponent(payload.email)}` : ""
          }`
        );
      }

      // All other cases, redirect to the returnTo url
      if ("new_user" in payload && !payload.new_user && payload.returnTo) {
        return router.push(payload.returnTo);
      }

      router.push(urls.app());
    },
    [router]
  );

  // Route user to the correct destination based on the query params
  useEffect(() => {
    if (router.isReady) {
      setLoading(false);

      // Handle login error cases
      if (router.query.error === "login_failed") {
        setLoginError(true);
      }

      // Handle login and signup cases
      if (!router.query.error && id_token) {
        doLogin({
          sign_in_with_world_id_token: id_token as string,
        });
      }
    }
  }, [router, doLogin, id_token]);

  useEffect(() => {
    if (error) {
      setLoginError(true);
    }
  }, [error]);

  return (
    <Auth pageTitle="Login" pageUrl="login">
      <div className="grid w-full min-h-screen grid-rows-[auto_1fr] py-8">
        <div className="flex justify-between items-center px-24 border-b border-gray-900/10 pb-6">
          <div className="grid">
            <Icon name="logo" className="w-[141px] h-6" />

            <span className="text-12 justify-self-end leading-none font-rubik">
              {"<"}
              <span className="font-medium">Dev</span>
              {"/Portal>"}
            </span>
          </div>

          <div className="grid grid-flow-col items-center gap-6">
            {canDevLogin && (
              <Button
                variant="danger"
                className="py-3 px-6"
                onClick={() => {
                  doLogin({
                    dev_login: process.env.NEXT_PUBLIC_DEV_LOGIN_KEY,
                  });
                }}
              >
                Dev Login
              </Button>
            )}

            <Link href={loginUrl ?? ""} className="contents">
              <Button
                className="flex gap-x-1 justify-between items-center px-6 py-2.5 text-16 text-gray-500 font-semibold"
                variant="secondary"
              >
                <span className="leading-[1.25]">Log in</span>
                <Icon name="arrow-right" className="w-6 h-6" />
              </Button>
            </Link>
          </div>
        </div>

        <div
          className={cn(
            "grid items-center justify-items-center w-full text-center",
            { "content-start": !loading }
          )}
        >
          {loginError && (
            <div className="bg-danger-light px-6 py-4 mb-20 -mt-10 rounded-md text-danger font-medium">
              There was a problem with your login. Please try again.
            </div>
          )}

          {loading && <Spinner className="mt-4" />}

          {!loading && (
            <>
              <div className="relative w-full h-[290px] overflow-hidden">
                <div className="absolute inset-x-0 -top-36 grid grid-cols-1 grid-rows-1 justify-items-center items-center">
                  <Image
                    src={torShape}
                    alt="tor shape illustration"
                    className="col-start-1 row-start-1"
                  />

                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white h-[80%]" />

                  <Icon
                    name="logomark"
                    className="w-16 h-16 col-start-1 row-start-1"
                  />
                </div>
              </div>

              <div className="justify-self-center max-w-[598px]">
                <h1 className="mt-9 text-32 font-semibold font-sora">
                  World ID is now generally available!
                </h1>

                <p className="mt-4 font-rubik text-20 text-657080">
                  The Worldcoin Protocol will enable a new class of applications
                  built on top of proof of personhood.
                </p>

                <p className="mt-6 font-sora">
                  Build for the People of the World
                </p>

                <div className="grid gap-y-4 mt-12 w-full">
                  <div className="grid grid-cols-2 gap-x-4">
                    <Link href="/api/auth/login">
                      <Button
                        type="button"
                        variant="secondary"
                        className="flex w-full h-full justify-between py-4 px-6 text-657080 text-16 font-semibold"
                      >
                        Login with email
                      </Button>
                    </Link>

                    <Link href={loginUrl ?? ""} className="contents">
                      <Button
                        type="button"
                        className="flex flex-1 justify-between px-6 py-4 text-16 font-semibold"
                      >
                        Log in or Sign up
                        <Icon name="arrow-right" className="w-6 h-6" />
                      </Button>
                    </Link>
                  </div>

                  <Link
                    href="https://docs.worldcoin.org"
                    className="contents"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button
                      className="flex flex-1 justify-between py-4 px-6 text-657080 text-16 font-semibold"
                      variant="secondary"
                    >
                      Explore Docs <Icon name="book" className="w-6 h-6" />
                    </Button>
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </Auth>
  );
}
