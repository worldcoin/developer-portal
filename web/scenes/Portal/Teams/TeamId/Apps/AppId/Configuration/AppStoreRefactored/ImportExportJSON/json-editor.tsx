import { TYPOGRAPHY } from "@/components/Typography";

import { CopyButton } from "@/components/CopyButton";
import { TextArea } from "@/components/TextArea";
import { Typography } from "@/components/Typography";

// pure ui components
type JSONEditorProps = {
  value: string;
  onChange: (value: string) => void;
  error?: string | null;
  disabled?: boolean;
};

export const JSONEditor = ({
  value,
  onChange,
  error,
  disabled,
}: JSONEditorProps) => {
  const textAreaRows = value.split("\n").length + 2;

  return (
    <div className="grid gap-y-3">
      <div className="flex items-center justify-between">
        <Typography variant={TYPOGRAPHY.R4} className="text-grey-500">
          Edit the JSON content below or upload a file to import localisations.
        </Typography>
      </div>

      <TextArea
        register={{} as any}
        label=""
        value={value}
        disabled={disabled}
        rows={textAreaRows}
        enableResize={true}
        onChange={(e) => onChange(e.target.value)}
        className="max-h-[40vh] w-full font-mono text-sm"
        topAddOn={<CopyButton fieldName="JSON" fieldValue={value} />}
      />

      {error && (
        <Typography variant={TYPOGRAPHY.R5} className="text-system-error-500">
          {error}
        </Typography>
      )}
    </div>
  );
};
