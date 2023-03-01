import { Auth } from "common/Auth";
import { Illustration } from "common/Auth/Illustration";
import { Typography } from "common/Auth/Typography";
import { Button } from "common/Auth/Button";
import Link from "next/link";
import { urls } from "urls";
import { useRouter } from "next/router";

export function Onboarding() {
  const router = useRouter();

  return (
    <Auth pageTitle="Login" pageUrl="onboarding">
      <Illustration icon="user-solid" />

      <Typography className="max-w-[320px] mt-8" variant="title">
        World ID is&nbsp;currently in&nbsp;beta
      </Typography>

      <Typography className="mt-2" variant="subtitle">
        Sign in with World ID or join our waitlist
      </Typography>

      <Button
        className="max-w-[327px] w-full h-[64px] mt-8 font-medium"
        onClick={() => router.push(urls.waitlist())}
      >
        Join the Waitlist
      </Button>

      <div className="flex gap-x-2 mt-6 font-rubik text-14 text-neutral-secondary">
        Already have an invite?
        <Link
          className="text-primary hover:text-primary/80 cursor-pointer"
          href={urls.login()}
        >
          Sign in
        </Link>
      </div>
    </Auth>
  );
}
