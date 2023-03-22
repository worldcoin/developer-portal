import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { Auth } from "src/components/Auth";
import { Typography } from "src/components/Auth/Typography";
import { Icon } from "src/components/Icon";
import { urls } from "src/lib/urls";
import { IInvitePageProps } from "src/pages/invite";

export function Invite({ loginUrl, nonce }: IInvitePageProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (router.isReady && router.query.token) {
      // Pause for 1 second
      setTimeout(() => setLoading(false), 1000);
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
        {loading && (
          <>
            <Icon name="spinner" className="h-8 w-8 animate-spin" noMask />
            <Typography className="mt-8" variant="title">
              Please wait while we process your invite.
            </Typography>
          </>
        )}
        {/* {!loading && (
          <>
            <Typography className="mt-8" variant="title">
              Welcome, please sign in to create your account.
            </Typography>
            <SignInWithWorldID
              app_id={process.env.SIGN_IN_WITH_WORLD_ID_APP_ID as string}
              nonce={nonce}
              onSuccess={() => console.log("success")}
            />
          </>
        )} */}
      </div>
    </Auth>
  );
}
