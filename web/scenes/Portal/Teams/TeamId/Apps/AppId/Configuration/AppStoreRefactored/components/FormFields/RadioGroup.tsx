import { Radio } from "@/components/Radio";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { FieldError } from "react-hook-form";

type RadioGroupProps = {
  value: boolean | undefined;
  onChange: (value: boolean) => void;
  disabled?: boolean;
  error?: FieldError;
  yesLabel?: string;
  noLabel?: string;
};

export const RadioGroup = ({
  value,
  onChange,
  disabled = false,
  error,
  yesLabel = "Yes",
  noLabel = "No",
}: RadioGroupProps) => {
  return (
    <div>
      <div className="flex gap-x-6">
        <Radio
          label={yesLabel}
          value="true"
          checked={value === true}
          onChange={() => onChange(true)}
          disabled={disabled}
          errors={error}
        />
        <Radio
          label={noLabel}
          value="false"
          checked={value === false}
          onChange={() => onChange(false)}
          disabled={disabled}
          errors={error}
        />
      </div>
      {error && (
        <Typography
          variant={TYPOGRAPHY.R4}
          className="mt-1 text-system-error-500"
        >
          {error.message}
        </Typography>
      )}
    </div>
  );
};
