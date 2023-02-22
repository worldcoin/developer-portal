import { Fragment, memo } from "react";
import { Button } from "common/Auth/Button";
import { Illustration } from "common/Auth/Illustration";
import { Typography } from "common/Auth/Typography";
import { Icon } from "common/Icon";

interface SigninInterface {}

export const Signin = memo(function Signin(props: SigninInterface) {
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
        <Icon name="wld-signin" className="w-[30px] h-[30px] mr-3" />
        Sign in with World ID
      </Button>

      <div className="flex gap-x-2 mt-6 font-rubik text-14 text-neutral-secondary">
        Don’t have World ID?
        <a
          className="text-primary hover:text-primary/80"
          href="#" // FIXME: Add link
        >
          Download the World App
        </a>
      </div>
    </Fragment>
  );
});
