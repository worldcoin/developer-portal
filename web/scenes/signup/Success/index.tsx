import { Fragment, memo } from "react";
import { Button } from "common/Auth/Button";
import { Illustration } from "common/Auth/Illustration";
import { Typography } from "common/Auth/Typography";

interface SuccessInterface {
  onContinue: () => void;
}

export const Success = memo(function Success(props: SuccessInterface) {
  return (
    <Fragment>
      <Illustration icon="success" color="success" />

      <Typography className="mt-8" variant="title">
        Welcome!
      </Typography>

      <Typography className="max-w-[260px] mt-2" variant="subtitle">
        You’re good to go, let’s start privately verifying unique humans
      </Typography>

      <Button
        className="max-w-[327px] w-full h-[64px] mt-8"
        onClick={props.onContinue}
      >
        Continue
      </Button>
    </Fragment>
  );
});
