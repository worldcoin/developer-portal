import { Fragment, memo } from "react";
import { Button } from "common/Auth/Button";
import { Illustration } from "common/Auth/Illustration";

interface SuccessInterface {
  onContinue: () => void;
}

export const Success = memo(function Success(props: SuccessInterface) {
  return (
    <Fragment>
      <Illustration icon="success" color="success" />

      <div className="mt-8 font-sora font-semibold text-32 text-center leading-10">
        Welcome!
      </div>

      <div className="max-w-[260px] mt-2 font-rubik text-16 text-center text-neutral-medium leading-5">
        You’re good to go, let’s start privately verifying unique humans
      </div>

      <Button
        className="max-w-[327px] w-full h-[64px] mt-8"
        onClick={props.onContinue}
      >
        Continue
      </Button>
    </Fragment>
  );
});
