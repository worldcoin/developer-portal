import { Auth } from "src/components/Auth";
import { Button } from "src/components/Auth/Button";
import { Illustration } from "src/components/Auth/Illustration";
import { Typography } from "src/components/Auth/Typography";

export function Waitlist() {
  return (
    <Auth pageTitle="Waitlist" pageUrl="waitlist">
      <div className="flex flex-col justify-center items-center max-w-[544px] p-12">
        <Illustration icon="user-add" color="warning" />
        <Typography className="max-w-[480px] mt-8" variant="title">
          It appears you don&apos;t have access yet
        </Typography>
        <Typography className="mt-2" variant="subtitle">
          You can join our waitlist below to get an invite code.
        </Typography>
        <a
          className="w-full flex justify-center mt-8"
          href="https://docs.worldcoin.org/waitlist"
        >
          <Button className="max-w-[327px] w-full h-[64px] font-medium">
            Join the Waitlist
          </Button>
        </a>
      </div>
    </Auth>
  );
}
