import { useRouter } from "next/router";
import { useEffect } from "react";
import { Auth } from "src/components/Auth";
import { Illustration } from "src/components/Auth/Illustration";
import { Typography } from "src/components/Auth/Typography";
import { urls } from "src/lib/urls";
import { IInvitePageProps } from "src/pages/invite";

export function Invite({ loginUrl }: IInvitePageProps) {
  const router = useRouter();

  useEffect(() => {
    if (router.isReady && router.query.token) {
      localStorage.setItem("invite_token", router.query.token as string);
    }
  }, [router]);

  useEffect(() => {
    const invite_token = localStorage.getItem("invite_token");
    if (invite_token) {
      router.push(loginUrl ?? "");
    } else {
      router.push(urls.waitlist());
    }
  }, [loginUrl, router]);

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
