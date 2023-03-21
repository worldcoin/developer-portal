import { useRouter } from "next/router";
import { useCallback, useEffect } from "react";
import { Auth } from "src/components/Auth";
import { Illustration } from "src/components/Auth/Illustration";
import { Typography } from "src/components/Auth/Typography";
import { urls } from "src/lib/urls";

export function Invite() {
  const router = useRouter();

  const validateInviteToken = useCallback(
    async (invite_token: string) => {
      const response = await fetch("/api/invite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          invite_token,
        }),
      });

      if (response.ok) {
        router.push(urls.login());
      }
    },
    [router]
  );

  useEffect(() => {
    if (router.isReady && router.query.token) {
      localStorage.setItem("invite_token", router.query.token as string);
    }
  }, [router]);

  useEffect(() => {
    const invite_token = localStorage.getItem("invite_token");
    if (invite_token) {
      validateInviteToken(invite_token);
    } else {
      router.push(urls.waitlist());
    }
  }, [router, validateInviteToken]);

  return (
    <Auth pageTitle="Invite" pageUrl="invite">
      <div className="flex flex-col items-center max-w-[544px] p-12">
        <Illustration icon="spinner" />
        <Typography className="mt-8" variant="title">
          Please wait while we process your invite.
        </Typography>
      </div>
    </Auth>
  );
}
