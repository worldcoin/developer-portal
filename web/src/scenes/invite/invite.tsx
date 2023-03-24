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
      <div className="flex flex-col items-center max-w-[640px] p-12">
        {loading && (
          <>
            <Icon name="spinner" className="h-8 w-8 animate-spin" noMask />
            <Typography className="mt-8" variant="title">
              Hold on, validating your invite....
            </Typography>
          </>
        )}
        {!loading && (
          <>
            <div className="relative">
              <Icon name="wld-logo" className="w-16 h-16" />
              <span className="absolute rounded-full bg-[#f7b12f] w-32 h-32 blur-xl opacity-[.15] left-1/2 -translate-x-1/2 bottom-1.5" />
              <span className="absolute rounded-full bg-[#007fd3] w-32 h-32 blur-xl opacity-10 top-[7px] right-px" />
              <span className="absolute rounded-full bg-[#ff4231] w-32 h-32 blur-xl opacity-10 left-[52px] bottom-[-22px]" />
            </div>
            <Typography className="mt-8 tracking-widest text-sm">
              WELCOME
            </Typography>
            <Typography className="mt-4" variant="title">
              Please continue with Worldcoin to create your account
            </Typography>
            <div className="mt-4 text-neutral-secondary text-center">
              If you don&apos;t have a World ID yet, download the app first.
            </div>
            <Link href={loginUrl ?? ""}>
              <Button variant="primary" className="py-5 px-14 mt-10">
                <Icon name="wld-logo" className="h-6 w-6 mr-2" />
                Sign In with Worldcoin
              </Button>
            </Link>
            <p className="mt-6 text-sm">
              Don&apos;t have the World App?{" "}
              <a className="text-primary" href="https://worldcoin.org/download">
                Download it here.
              </a>
            </p>
          </>
        )}
      </div>
    </Auth>
  );
}
