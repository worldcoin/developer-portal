import { useRouter } from "next/router";
import { useCallback, useEffect, useState } from "react";
import { Auth } from "src/components/Auth";
import { Button } from "src/components/Button";
import { Icon } from "src/components/Icon";
import { Link } from "src/components/Link";
import { Spinner } from "src/components/Spinner";
import { urls } from "src/lib/urls";
import { LoginRequestBody, LoginRequestResponse } from "src/pages/api/login";
import { ILoginPageProps } from "src/pages/login";

const canDevLogin = Boolean(process.env.NEXT_PUBLIC_DEV_LOGIN_KEY);

export function Login({ loginUrl }: ILoginPageProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [loginError, setLoginError] = useState(false);
  const [inviteError, setInviteError] = useState(false);

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
      if (!response.ok) {
        router.push(`${urls.login()}?error=${payload.code ?? "login"}`);
      }

      // User has a signup token, redirect to signup page
      if (payload.new_user && payload.signup_token) {
        localStorage.setItem("signup_token", payload.signup_token);
        return router.push(
          `${urls.signup()}?email=${encodeURIComponent(payload.email)}`
        );
      }

      // All other cases, redirect to the returnTo url
      if (!payload.new_user && payload.returnTo) {
        return router.push(payload.returnTo);
      }

      router.push(urls.app());
    },
    [router]
  );

  useEffect(() => {
    const invite_token = localStorage.getItem("invite_token");

    if (router.isReady) {
      setLoading(false);
      if (router.query.id_token) {
        doLogin({
          sign_in_with_world_id_token: router.query.id_token as string,
          invite_token: invite_token as string,
        });
      } else if (invite_token) {
        router.push(loginUrl ?? "");
      }

      if (router.query.error === "login") {
        setLoginError(true);
      } else if (router.query.error === "invite") {
        setInviteError(true);
      }
    }
  }, [router, doLogin, loginUrl]);

  return (
    <Auth pageTitle="Login" pageUrl="login">
      <div className="grid min-h-screen grid-rows-[auto_1fr] p-8">
        <div className="flex justify-between items-center w-screen px-24">
          <Icon name="logo" className="w-48 h-8" />

          <div className="grid grid-flow-col items-center gap-6">
            {canDevLogin && (
              <Button
                variant="danger"
                className="py-3 px-8"
                onClick={() => {
                  doLogin({
                    dev_login: process.env.NEXT_PUBLIC_DEV_LOGIN_KEY,
                  });
                }}
              >
                Dev Login
              </Button>
            )}
            <Link href={loginUrl ?? ""}>
              <Button variant="secondary" className="py-3 px-8">
                Log in
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid place-content-center justify-items-center justify-self-center max-w-[532px] text-center">
          {loginError && (
            <div className="bg-danger-light px-6 py-4 mb-20 -mt-10 rounded-md text-danger font-medium">
              There was a problem with your login. Please try again.
            </div>
          )}
          {inviteError && (
            <div className="bg-danger-light px-6 py-4 mb-20 -mt-10 rounded-md text-danger font-medium">
              Your invite code was invalid, please reach out to a Worldcoin
              contributor.
            </div>
          )}

          {loading && <Spinner className="mt-4" />}
          {!loading && (
            <>
              <div className="relative">
                <Icon name="wld-logo" className="w-16 h-16" />
                {/* span[className="absolute rounded-full"]/*3 */}
                <span className="absolute rounded-full bg-[#f7b12f] w-32 h-32 blur-xl opacity-[.15] left-1/2 -translate-x-1/2 bottom-1.5" />
                <span className="absolute rounded-full bg-[#007fd3] w-32 h-32 blur-xl opacity-10 top-[7px] right-px" />
                <span className="absolute rounded-full bg-[#ff4231] w-32 h-32 blur-xl opacity-10 left-[52px] bottom-[-22px]" />
              </div>
              <h1 className="mt-9 text-32 font-semibold font-sora">
                Build for the People of the World
              </h1>

              <p className="mt-4 font-rubik text-20 text-657080">
                The Worldcoin Protocol will enable a new class of applications
                built on top of proof of personhood.
              </p>
              <p className="mt-6 font-sora">
                Join the waitlist for early access to the SDK.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mt-12 w-full">
                <a
                  href="https://docs.worldcoin.org"
                  className="contents"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button
                    className="flex flex-1 justify-between py-5 px-6 text-657080 text-16 font-semibold"
                    variant="secondary"
                  >
                    Explore Docs <Icon name="book" className="w-6 h-6" />
                  </Button>
                </a>

                <a
                  href="https://docs.worldcoin.org/waitlist"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="contents"
                >
                  <Button className="flex flex-1 justify-between px-6 py-5 text-16 font-semibold">
                    Join Waitlist
                    <Icon name="arrow-right" className="w-6 h-6" />
                  </Button>
                </a>
              </div>
            </>
          )}
        </div>
      </div>
    </Auth>
  );
}
