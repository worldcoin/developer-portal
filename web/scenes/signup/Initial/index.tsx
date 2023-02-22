import { Fragment, memo } from "react";
import { FieldLabel } from "common/Auth/FieldLabel";
import { FieldInput } from "common/Auth/FieldInput";
import { FieldText } from "common/Auth/FieldText";
import { Checkbox } from "common/Auth/Checkbox";
import { Button } from "common/Auth/Button";
import { Illustration } from "common/Auth/Illustration";
import { Typography } from "common/Auth/Typography";

interface InitialInterface {
  onSuccess: () => void;
}

export const Initial = memo(function Initial(props: InitialInterface) {
  return (
    <Fragment>
      <Illustration icon="user-solid" />

      <Typography className="mt-8" variant="title">
        Nice to meet you
      </Typography>

      <Typography className="mt-2" variant="subtitle">
        Just a few details to create your account
      </Typography>

      <div className="flex flex-col mt-8 w-full">
        <FieldLabel className="mb-2">Email</FieldLabel>

        <div className="relative">
          <FieldInput
            className="w-full"
            placeholder="enter email address"
            type="email"
          />
        </div>

        <FieldText className="mt-3">
          Only for transactional notifications, unless you want to receive
          updates
        </FieldText>
      </div>

      <div className="flex flex-col mt-8 w-full">
        <FieldLabel className="mb-2">Team name</FieldLabel>

        <div className="relative">
          <FieldInput
            className="w-full"
            placeholder="input your teams name"
            type="text"
          />
        </div>
      </div>

      <div className="w-full mt-8 grid gap-y-4">
        <Checkbox label="I agree with the Developer Portal Terms, which incorporates by reference the Worldcoin User Terms and Conditions and the Worldcoin Privacy Statement." />

        <Checkbox label="I want to receive product updates about Worldcoin for developers." />
      </div>

      <Button
        className="max-w-[327px] w-full h-[64px] mt-8"
        onClick={props.onSuccess}
      >
        Create my account
      </Button>
    </Fragment>
  );
});
