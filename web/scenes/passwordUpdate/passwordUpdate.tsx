import { FieldGroup } from "common/FieldGroup";
import { FieldInput } from "common/FieldInput";
import { FieldError } from "common/FieldError";
import { ModalWindowSection } from "common/MultiModal/ModalWindowSection";
import { useActions, useValues } from "kea";
import { Field, Form } from "kea-forms";
import { memo, useEffect, useState } from "react";
import cn from "classnames";
import { passwordUpdateLogic } from "./passwordUpdateLogic";
import { EyeAddon } from "common/Auth/AuthField/EyeAddon";
import { Icon } from "common/Icon";
import { Button } from "common/Button";

export const PasswordUpdate = memo(function passwordUpdate() {
  const { isPasswordUpdateSubmitting } = useValues(passwordUpdateLogic);
  const { resetPasswordUpdate, submitPasswordUpdate } =
    useActions(passwordUpdateLogic);

  const [passwordShown, setPasswordShown] = useState(false);
  const [newPasswordShown, setNewPasswordShown] = useState(false);
  const [newPasswordRepeatShown, setNewPasswordRepeatShown] = useState(false);

  // FIXME add logic for changing button states
  const [forceSuccessState] = useState(false);

  useEffect(() => {
    return () => {
      resetPasswordUpdate();
    };
  }, []);

  return (
    <Form
      logic={passwordUpdateLogic}
      formKey="passwordUpdate"
      className="grid flow-rows"
    >
      <ModalWindowSection>
        <FieldGroup
          label={
            <div className="grid grid-flow-col justify-between w-full font-normal">
              <span>Current password</span>
            </div>
          }
        >
          <Field noStyle name="current_password">
            {({ value, onChange, error }) => (
              <div
                className={cn({
                  "mb-6": !error,
                })}
              >
                <FieldInput
                  variant="small"
                  value={value}
                  onChange={({ target: { value } }) => onChange(value)}
                  error={error}
                  type={!passwordShown ? "password" : undefined}
                  addon={
                    <EyeAddon
                      active={passwordShown}
                      onChangeActive={setPasswordShown}
                    />
                  }
                />
                {error && <FieldError className="mb-2.5">{error}</FieldError>}
              </div>
            )}
          </Field>
        </FieldGroup>

        <FieldGroup
          label={
            <div className="grid grid-flow-col justify-between w-full font-normal">
              <span>New password</span>
            </div>
          }
        >
          <Field noStyle name="new_password">
            {({ value, onChange, error }) => (
              <div
                className={cn({
                  "mb-6": !error,
                })}
              >
                <FieldInput
                  variant="small"
                  value={value}
                  onChange={({ target: { value } }) => onChange(value)}
                  error={error}
                  type={!newPasswordShown ? "password" : undefined}
                  addon={
                    <EyeAddon
                      active={newPasswordShown}
                      onChangeActive={setNewPasswordShown}
                    />
                  }
                />
                {error && <FieldError className="mb-2.5">{error}</FieldError>}
              </div>
            )}
          </Field>
        </FieldGroup>

        <FieldGroup
          label={
            <div className="grid grid-flow-col justify-between w-full font-normal">
              <span>Confirm new password</span>
            </div>
          }
        >
          <Field noStyle name="new_password_repeat">
            {({ value, onChange, error }) => (
              <div
                className={cn({
                  "mb-6": !error,
                })}
              >
                <FieldInput
                  variant="small"
                  value={value}
                  onChange={({ target: { value } }) => onChange(value)}
                  error={error}
                  type={!newPasswordRepeatShown ? "password" : undefined}
                  addon={
                    <EyeAddon
                      active={newPasswordRepeatShown}
                      onChangeActive={setNewPasswordRepeatShown}
                    />
                  }
                />
                {error && <FieldError className="mb-2.5">{error}</FieldError>}
              </div>
            )}
          </Field>
        </FieldGroup>
      </ModalWindowSection>
      <ModalWindowSection className="grid grid-flow-cols">
        <Button
          color="primary"
          variant="contained"
          fullWidth
          onClick={submitPasswordUpdate}
        >
          {forceSuccessState && (
            <div className="grid grid-flow-col items-center justify-center gap-x-2">
              <Icon name="check" className="w-5 h-5" />
              <div>Password changed</div>
            </div>
          )}
          {!forceSuccessState && <span>Change password</span>}
        </Button>
      </ModalWindowSection>
    </Form>
  );
});
