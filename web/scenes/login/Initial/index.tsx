import { Fragment, memo } from "react";
import { Button } from "common/Auth/Button";
import { Illustration } from "common/Auth/Illustration";
import { Typography } from "common/Auth/Typography";

interface InitialInterface {
  onSignin: () => void;
}

export const Initial = memo(function Initial(props: InitialInterface) {
  return (
    <Fragment>
      <Illustration icon="user-solid" />

      <Typography className="max-w-[320px] mt-8" variant="title">
        World ID is&nbsp;currently in&nbsp;beta
      </Typography>

      <Typography className="mt-2" variant="subtitle">
        Sign in with World ID or join our waitlist
      </Typography>

      <Button className="max-w-[327px] w-full h-[64px] mt-8 font-medium">
        Join the Waitlist
      </Button>

      <div className="flex gap-x-2 mt-6 font-rubik text-14 text-neutral-secondary">
        Already have an invite?
        <a
          className="text-primary hover:text-primary/80 cursor-pointer"
          onClick={props.onSignin}
        >
          Sign in
        </a>
      </div>
    </Fragment>
  );
});
