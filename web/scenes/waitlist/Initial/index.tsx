import { Illustration } from "common/Auth/Illustration";
import { Typography } from "common/Auth/Typography";
import { Button } from "common/Auth/Button";
import { FieldInput } from "common/FieldInput";
import { FieldGroup } from "common/FieldGroup";
import { ChangeEvent, FormEvent, Fragment, useCallback, useState } from "react";
import { FieldTextArea } from "common/FieldTextArea";
import classNames from "classnames";
import { Icon } from "common/Icon";

interface InitialInterface {
  onSuccess: () => void;
}

export function Initial(props: InitialInterface) {
  const [email, setEmail] = useState("");
  const [emailValid, setEmailValid] = useState(false);

  const handleChangeEmail = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    setEmailValid(e.target.validity.valid);
  }, []);

  const handleSubmit = useCallback(
    (e: FormEvent<HTMLFormElement>) => {
      if (emailValid) {
        props.onSuccess();
      }
    },
    [emailValid, props]
  );

  return (
    <Fragment>
      <div className="flex flex-col items-center">
        <Illustration icon="envelope" />

        <Typography className="max-w-[320px] mt-8" variant="title">
          Join the waitlist
        </Typography>

        <Typography className="mt-2" variant="subtitle">
          We’re gonna email you your invitation code
        </Typography>
      </div>

      <form className="flex flex-col gap-8 w-full" onSubmit={handleSubmit}>
        <FieldGroup label="Email">
          <span className="flex items-center relative">
            <FieldInput
              className="w-full"
              type="email"
              onChange={handleChangeEmail}
              value={email}
            />
            <Icon
              name="checkmark-selected"
              className={classNames(
                "h-6 w-6 absolute right-4 bg-success transition-opacity",
                {
                  "opacity-0": !emailValid,
                  "opacity-100": emailValid,
                }
              )}
            />
          </span>
        </FieldGroup>

        <FieldGroup
          label={
            <>
              Tell us about your project{" "}
              <span className="text-neutral-secondary">(optional)</span>
            </>
          }
        >
          <FieldTextArea id="waitlist-email" />
        </FieldGroup>

        <Button className="py-5 px-14 mx-auto" disabled={!emailValid}>
          Join early access waitlist
        </Button>
      </form>
    </Fragment>
  );
}
