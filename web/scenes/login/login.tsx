import { Auth } from "common/Auth";
import { AuthField } from "common/Auth/AuthField";
import { EyeAddon } from "common/Auth/AuthField/EyeAddon";
import { Link } from "common/Link";
import { Button } from "common/Button";
import { memo, useState } from "react";
import { Form } from "kea-forms";
import { loginLogic } from "./loginLogic";
import { useValues } from "kea";
import { text } from "common/styles";
import cn from "classnames";

export const Login = memo(function Login() {
  const { loginError, isLoginSubmitting } = useValues(loginLogic);
  const [passwordShown, setPasswordShown] = useState(false);

  return (
    <Auth
      pageTitle="Login"
      pageUrl="login"
      title="Welcome back!"
      caption="Enter your credentials to access your account."
    >
      <Form
        className="mt-12 grid gap-8"
        logic={loginLogic}
        formKey="login"
        enableFormOnSubmit
        name="login-form"
      >
        <AuthField
          label="Email"
          type="email"
          name="email"
          placeholder="me@petorbz.com"
          disabled={isLoginSubmitting}
        />

        <AuthField
          label="Password"
          labelLink={
            <Link className="text-primary" href="/forgot">
              Forgot password?
            </Link>
          }
          type={passwordShown ? "text" : "password"}
          name="password"
          placeholder="········"
          disabled={isLoginSubmitting}
          addon={
            <EyeAddon
              active={passwordShown}
              onChangeActive={setPasswordShown}
            />
          }
          error={loginError}
        />

        <Button
          className="mt-4"
          variant="contained"
          color="primary"
          fullWidth
          type="submit"
          loading={isLoginSubmitting}
          name="login-submit"
        >
          Log in
        </Button>
      </Form>

      <p className={cn(text.caption, "mt-6 text-center leading-5")}>
        Don&apos;t have an account?&nbsp;
        <Link className="font-medium" href="/signup">
          Sign Up
        </Link>
      </p>
    </Auth>
  );
});
