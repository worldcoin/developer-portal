import { Auth } from "common/Auth";
import { AuthField } from "common/Auth/AuthField";
import { Button } from "common/Button";
import { memo } from "react";
import { Form } from "kea-forms";
import { forgotLogic } from "./forgotLogic";
import { useValues } from "kea";

export const Forgot = memo(function Forgot() {
  const { isForgotSubmitting } = useValues(forgotLogic);

  return (
    <Auth
      pageTitle="Forgot password?" // FIXME: Correct after the design appears
      title="Forgot password?" // FIXME: Correct after the design appears
      caption="Enter your email" // FIXME: Correct after the design appears
    >
      <Form
        className="mt-12 grid gap-8"
        logic={forgotLogic}
        formKey="forgot"
        enableFormOnSubmit
      >
        <AuthField
          label="Email"
          type="email"
          name="email"
          placeholder="me@petorbz.com"
          disabled={isForgotSubmitting}
        />

        <Button
          className="mt-4"
          variant="contained"
          color="primary"
          fullWidth
          type="submit"
          loading={isForgotSubmitting}
        >
          Send verification email{" "}
          {/* FIXME: Correct after the design appears */}
        </Button>
      </Form>
    </Auth>
  );
});
