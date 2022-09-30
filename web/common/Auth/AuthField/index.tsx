import { Field } from "kea-forms";
import { FieldGroup } from "common/FieldGroup";
import { FieldInput } from "common/FieldInput";
import { FieldError } from "common/FieldError";
import { memo, ReactNode } from "react";

interface AuthFieldInterface {
  name: string;
  className?: string;
  label: ReactNode;
  labelLink?: ReactNode;
  type?: string;
  addon?: ReactNode;
  error?: string | null;
  disabled?: boolean;
  placeholder?: string;
}

export const AuthField = memo(function AuthField(props: AuthFieldInterface) {
  return (
    <Field name={props.name} noStyle>
      {({ value, onChange, error }) => {
        const errorToShow = props.error || error;
        return (
          <FieldGroup variant="small" label={props.label}>
            <FieldInput
              variant="small"
              name={props.name}
              type={props.type}
              placeholder={props.placeholder}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              disabled={props.disabled}
              addon={props.addon}
              error={errorToShow}
            />
            {errorToShow && (
              <FieldError className="-mt-1 px-2 py-1">{errorToShow}</FieldError>
            )}
          </FieldGroup>
        );
      }}
    </Field>
  );
});
