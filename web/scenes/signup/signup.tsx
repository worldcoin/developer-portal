import { Auth } from "common/Auth";
import { Checkbox } from "common/components/Checkbox";
import { AuthField } from "common/Auth/AuthField";
import { EyeAddon } from "common/Auth/AuthField/EyeAddon";
import { Link } from "common/Link";
import { Button } from "common/Button";
import { Fragment, useState } from "react";
import { Field, Form } from "kea-forms";
import { FieldError } from "common/FieldError";
import { signupLogic } from "./signupLogic";
import { worldcoinLegalCenter } from "common/helpers/worldcoin-legal-center";
import { useValues } from "kea";
import { text } from "common/styles";
import cn from "classnames";

export function Signup() {
  const { isSignupSubmitting } = useValues(signupLogic);
  const [passwordShown, setPasswordShown] = useState(false);

  return (
    <Auth
      pageTitle="Sign Up"
      pageUrl="signup"
      title="Create your account!"
      caption="Please enter your details below."
    >
      <Form
        logic={signupLogic}
        formKey="signup"
        className="mt-12 grid gap-6"
        enableFormOnSubmit
      >
        <AuthField label="Name" name="name" disabled={isSignupSubmitting} />

        <AuthField
          label="Email"
          type="email"
          name="email"
          disabled={isSignupSubmitting}
        />

        <AuthField
          label="Password"
          type={passwordShown ? "text" : "password"}
          name="password"
          addon={
            <EyeAddon
              active={passwordShown}
              onChangeActive={setPasswordShown}
            />
          }
          disabled={isSignupSubmitting}
        />

        <AuthField
          label="Team name"
          name="team_name"
          disabled={isSignupSubmitting}
        />

        <div className="grid gap-y-4">
          <Field name="termsAccepted" noStyle>
            {({ onChange, value, error }) => (
              <Fragment>
                <div className="grid grid-cols-auto/1fr gap-x-4 leading-5">
                  <Checkbox
                    label={
                      <span>
                        I agree with the{" "}
                        <Link
                          href={worldcoinLegalCenter.developerPortalTerms}
                          className="underline !text-neutral"
                          external
                        >
                          Developer Portal Terms
                        </Link>
                        , which incorporates by reference the Worldcoin User{" "}
                        <Link
                          href={worldcoinLegalCenter.userAgreement}
                          className="underline !text-neutral"
                          external
                        >
                          Terms and Conditions
                        </Link>{" "}
                        and the Worldcoin{" "}
                        <Link
                          href={worldcoinLegalCenter.privacyStatement}
                          className="underline !text-neutral"
                          external
                        >
                          Privacy Statement
                        </Link>
                        .
                      </span>
                    }
                    checked={value}
                    onChange={onChange}
                    disabled={isSignupSubmitting}
                  />
                </div>

                {error && (
                  <FieldError className="col-span-3 mt-1 px-2 py-1">
                    {error}
                  </FieldError>
                )}
              </Fragment>
            )}
          </Field>
          <Field name="is_subscribed" noStyle>
            {({ value, onChange, error }) => (
              <>
                <Checkbox
                  label={
                    <span>
                      Receive product updates. Unsubscribe at any time.
                    </span>
                  }
                  checked={value}
                  onChange={onChange}
                  disabled={isSignupSubmitting}
                />
                {error && (
                  <FieldError className="col-span-3 mt-1 px-2 py-1">
                    {error}
                  </FieldError>
                )}
              </>
            )}
          </Field>
        </div>
        <Button
          className="mt-9"
          variant="contained"
          color="primary"
          fullWidth
          type="submit"
          disabled={isSignupSubmitting}
        >
          Sign Up
        </Button>
      </Form>

      <p className={cn(text.caption, "mt-6 text-center leading-5")}>
        Already have an account?&nbsp;
        <Link className="font-medium" href="/login">
          Login
        </Link>
      </p>
    </Auth>
  );
}
