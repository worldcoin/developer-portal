import { useRouter } from "next/router";
import { useCallback, useEffect, useState } from "react";
import { Auth } from "src/components/Auth";
import { Icon } from "@/components/Icon";
import { Spinner } from "src/components/Spinner";
import { urls } from "@/lib/urls";
import { ILoginPageProps } from "@/pages/login-with-invite";
import {
  LoginRequestBody,
  LoginRequestResponse,
} from "@/pages/api/login-with-invite";
import { deleteCookie, getCookie } from "cookies-next";

export function Login({ loginUrl }: ILoginPageProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  const doLogin = useCallback(
    async (body: LoginRequestBody) => {
      setLoading(true);

      // NOTE: After this fetch user will be redirected to dashboard.
      const response = await fetch("/api/login-with-invite", {
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
          `/login-with-invite?error=${payload.code ?? "login_failed"}`
        );
      }

      deleteCookie("invite_id");
      router.push(urls.app());
    },
    [router]
  );

  // Route user to the correct destination based on the query params
  useEffect(() => {
    if (router.isReady) {
      setLoading(false);
    }

    if (router.query.error) {
      return;
    }

    if (router.query.id_token) {
      const invite_id = getCookie("invite_id")?.toString();

      doLogin({
        sign_in_with_world_id_token: router.query.id_token as string,
        invite_id: invite_id ?? "",
      });
    } else if (router.query.invite) {
      router.push(loginUrl ?? "");
    }
  }, [router, doLogin, loginUrl]);

  return (
    <Auth pageTitle="Login" pageUrl="login-with-invite">
      <div className="grid w-full min-h-screen grid-rows-[auto_1fr] py-8">
        <div className="flex justify-between items-center px-24">
          <Icon name="logo" className="w-48 h-8" />
        </div>

        <div className="grid place-content-center justify-items-center justify-self-center max-w-[532px] text-center">
          {!!router.query.error && (
            <>
              {router.query.error === "invalid_invite" ? (
                <div className="bg-danger-light px-6 py-4 mb-20 -mt-10 rounded-md text-danger font-medium">
                  Invalid invite.
                </div>
              ) : router.query.error === "user_already_exists" ? (
                <div className="bg-danger-light px-6 py-4 mb-20 -mt-10 rounded-md text-danger font-medium">
                  User already exists.
                </div>
              ) : router.query.error === "user_not_created" ? (
                <div className="bg-danger-light px-6 py-4 mb-20 -mt-10 rounded-md text-danger font-medium">
                  User not created.
                </div>
              ) : (
                <div className="bg-danger-light px-6 py-4 mb-20 -mt-10 rounded-md text-danger font-medium">
                  There was a problem with your login. Please try again.
                </div>
              )}
            </>
          )}

          {loading && <Spinner className="mt-4" />}
        </div>
      </div>
    </Auth>
  );
}
