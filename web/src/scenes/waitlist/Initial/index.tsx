import { Illustration } from "src/components/Auth/Illustration";
import { Typography } from "src/components/Auth/Typography";
import { Button } from "src/components/Auth/Button";
import { FieldInput } from "src/components/FieldInput";
import { FieldGroup } from "src/components/FieldGroup";
import { ChangeEvent, FormEvent, Fragment, useCallback, useState } from "react";
import { FieldTextArea } from "src/components/FieldTextArea";
import classNames from "classnames";
import { Icon } from "src/components/Icon";

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
        <FieldGroup className="font-rubik" label="Email">
          <span className="flex items-center relative">
            <FieldInput
              className="w-full font-rubik"
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
          className="font-rubik"
          label={
            <>
              Tell us about your project{" "}
              <span className="text-neutral-secondary">(optional)</span>
            </>
          }
        >
          <FieldTextArea id="waitlist-email" className="font-rubik" />
        </FieldGroup>

        <Button className="py-5 px-14 mx-auto" disabled={!emailValid}>
          Join early access waitlist
        </Button>
      </form>
    </Fragment>
  );
}
