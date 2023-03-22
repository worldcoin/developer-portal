import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { Auth } from "src/components/Auth";
import { Typography } from "src/components/Auth/Typography";
import { Button } from "src/components/Button";
import { Icon } from "src/components/Icon";
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
        {!loading && (
          <>
            <Typography className="mt-8" variant="title">
              Welcome, please sign in to create your account.
            </Typography>
            <Link href={loginUrl ?? ""}>
              <Button variant="primary" className="py-3 px-8 mt-8">
                <Icon name="wld-logo" className="h-6 w-6 mr-2" />
                Sign In with Worldcoin
              </Button>
            </Link>
          </>
        )}
      </div>
    </Auth>
  );
}
