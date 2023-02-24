import { FieldGroup } from "common/FieldGroup";
import { FieldInput } from "common/LegacyFieldInput";
import { FieldError } from "common/FieldError";
import { Button } from "common/LegacyButton";
import { ModalWindowSection } from "common/MultiModal/ModalWindowSection";
import { Field, Form } from "kea-forms";
import { memo, useEffect } from "react";
import cn from "classnames";
import { useActions, useValues } from "kea";
import { profileSettingsLogic } from "./profileSettingsLogic";
import { useToggle } from "common/hooks";

const EMAIL_PLACEHOLDER = "no@email";
const PASSWORD_PLACEHOLDER = "password";

export const ProfileSettings = memo(function ProfileSettings(props: {
  onPasswordChange: () => void;
}) {
  const { profileSettingsChanged } = useValues(profileSettingsLogic);
  const { submitProfileSettings } = useActions(profileSettingsLogic);
  const nameEdit = useToggle(false);
  const teamNameEdit = useToggle(false);

  useEffect(() => {
    return () => {
      nameEdit.toggleOff();
      teamNameEdit.toggleOff();
    };
  }, []);

  return (
    <Form
      logic={profileSettingsLogic}
      formKey="profileSettings"
      className="grid flow-rows"
    >
      <ModalWindowSection>
        <FieldGroup
          label={
            <div className="grid grid-flow-col justify-between w-full font-normal">
              <span>Name</span>
              {!nameEdit.isOn && (
                <button
                  onClick={nameEdit.toggleOn}
                  className="text-14 text-primary"
                >
                  Edit
                </button>
              )}
            </div>
          }
        >
          <Field noStyle name="name">
            {({ value, onChange, error }) => (
              <div>
                <FieldInput
                  variant="small"
                  readOnly={!nameEdit.isOn}
                  value={value}
                  onChange={(event) => onChange(event.target.value)}
                  error={error}
                  className={cn({
                    "mb-6": !error,
                  })}
                />
                {error && <FieldError className="mb-2.5">{error}</FieldError>}
              </div>
            )}
          </Field>
        </FieldGroup>

        <FieldGroup
          label={
            <div className="grid grid-flow-col justify-between w-full font-normal">
              <span>Email</span>
            </div>
          }
        >
          <FieldInput
            variant="small"
            readOnly
            value={EMAIL_PLACEHOLDER}
            className="mb-6"
          />
        </FieldGroup>

        <FieldGroup
          label={
            <div className="grid grid-flow-col justify-between w-full font-normal">
              <span>Password</span>
              <button
                onClick={props.onPasswordChange}
                className="text-14 text-primary"
              >
                Change password
              </button>
            </div>
          }
        >
          <FieldInput
            type="password"
            variant="small"
            readOnly
            value={PASSWORD_PLACEHOLDER}
            className="mb-6"
          />
        </FieldGroup>

        <FieldGroup
          label={
            <div className="grid grid-flow-col justify-between w-full font-normal">
              <span>Team name</span>
              {!teamNameEdit.isOn && (
                <button
                  onClick={teamNameEdit.toggleOn}
                  className="text-14 text-primary"
                >
                  Edit
                </button>
              )}
            </div>
          }
        >
          <Field noStyle name="team_name">
            {({ value, onChange, error }) => (
              <div>
                <FieldInput
                  variant="small"
                  readOnly={!teamNameEdit.isOn}
                  value={value}
                  onChange={(event) => onChange(event.target.value)}
                  error={error}
                  className={cn({
                    "mb-6": !error,
                  })}
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
          onClick={submitProfileSettings}
          disabled={!profileSettingsChanged}
        >
          Save
        </Button>
      </ModalWindowSection>
    </Form>
  );
});
