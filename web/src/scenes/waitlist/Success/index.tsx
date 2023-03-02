import { Fragment, memo } from "react";
import { Illustration } from "src/components/Auth/Illustration";
import { Typography } from "src/components/Auth/Typography";
import { useRouter } from "next/router";
import { Button } from "src/components/Button";

export const Success = memo(function Success() {
  const router = useRouter();

  return (
    <Fragment>
      <Illustration icon="success" color="success" />

      <div className="flex flex-col items-center">
        <Typography variant="title">
          Successfully joined the World ID Waitlist
        </Typography>

        <Typography className="max-w-[260px] mt-2" variant="subtitle">
          We will send you an e-mail with invite code when the time is right!
        </Typography>
      </div>

      <Button
        className="p-5 px-12"
        onClick={() => window.open("https://docs.worldcoin.org", "_blank")}
      >
        Learn more about World ID
      </Button>
    </Fragment>
  );
});
