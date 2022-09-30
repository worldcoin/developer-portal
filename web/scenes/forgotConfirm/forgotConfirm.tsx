import { Auth } from "common/Auth";
import { AuthField } from "common/Auth/AuthField";
import { EyeAddon } from "common/Auth/AuthField/EyeAddon";
import { Button } from "common/Button";
import { memo, useState } from "react";
import { Form } from "kea-forms";
import { forgotConfirmLogic } from "./forgotConfirmLogic";
import { useValues } from "kea";
import { useRouter } from "next/router";

export const ForgotConfirm = memo(function ForgotConfirm() {
  const router = useRouter();
  const { isForgotConfirmSubmitting } = useValues(forgotConfirmLogic);
  const [passwordShown, setPasswordShown] = useState(false);

  return (
    <Auth
      pageTitle="Change password" // FIXME: Correct after the design appears
      title="Change password" // FIXME: Correct after the design appears
      caption="Enter new password" // FIXME: Correct after the design appears
    >
      <Form
        className="mt-12 grid gap-8"
        logic={forgotConfirmLogic}
        props={{
          token: router.query.token,
        }}
        formKey="forgotConfirm"
        enableFormOnSubmit
      >
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
          disabled={isForgotConfirmSubmitting}
        />

        <Button
          className="mt-4"
          variant="contained"
          color="primary"
          fullWidth
          type="submit"
          loading={isForgotConfirmSubmitting}
        >
          Change password {/* FIXME: Correct after the design appears */}
        </Button>
      </Form>
    </Auth>
  );
});
