import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { Auth } from "src/components/Auth";
import { Typography } from "src/components/Auth/Typography";
import { Button } from "src/components/Button";
import { Icon } from "src/components/Icon";
import { IInvitePageProps } from "src/pages/invite";

export function Invite({ loginUrl }: IInvitePageProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (router.isReady) {
      if (router.query.token) {
        // Pause for 1 second
        setTimeout(() => setLoading(false), 1000);
        localStorage.setItem("invite_token", router.query.token as string);
      } else {
        window.location.href = "/waitlist";
      }
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
            <Typography className="mt-8 tracking-widest text-sm text-primary uppercase">
              Introducing the Worldcoin SDK
            </Typography>
            <Typography className="mt-4" variant="title">
              We are delighted you are here!
            </Typography>
            <div className="mt-4 text-neutral-secondary text-center">
              You are amongst the first to build with the Worldcoin SDK. Use
              your World ID to create your account below.
            </div>
            <Link href={loginUrl ?? ""}>
              <Button variant="primary" className="py-5 px-14 mt-4">
                <Icon name="wld-logo" className="h-6 w-6 mr-2" />
                Sign Up with Worldcoin
              </Button>
            </Link>
            <p className="mt-6 text-sm text-neutral-secondary ">
              Don&apos;t have your World ID yet?{" "}
              <a
                className="text-primary"
                href="https://worldcoin.org/download"
                target="_blank"
                rel="noopener noreferrer"
              >
                Download the World App
              </a>
              .
            </p>
          </>
        )}
      </div>
    </Auth>
  );
}
