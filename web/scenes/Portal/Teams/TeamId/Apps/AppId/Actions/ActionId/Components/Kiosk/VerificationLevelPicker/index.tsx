import { Radio } from "@/components/Radio";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { LegacyVerificationLevel } from "@/lib/idkit";
import { memo } from "react";
import { twMerge } from "tailwind-merge";

type VerificationLevelPickerProps = {
  verificationLevel: LegacyVerificationLevel;
  resetKioskAndUpdateVerificationLevel: (
    value: LegacyVerificationLevel,
  ) => void;
  className?: string;
};
export const VerificationLevelPicker = memo(function VerificationLevelPicker(
  props: VerificationLevelPickerProps,
) {
  const { verificationLevel, resetKioskAndUpdateVerificationLevel, className } =
    props;

  return (
    <div
      className={twMerge(
        "flex flex-col items-center justify-center gap-x-3",
        className,
      )}
    >
      <Typography variant={TYPOGRAPHY.R4} className="text-grey-700">
        Verification level:
      </Typography>
      <div className="flex flex-row items-center justify-center gap-x-3">
        <Radio
          value={LegacyVerificationLevel.Device}
          label="Device"
          checked={verificationLevel === LegacyVerificationLevel.Device}
          onChange={() =>
            resetKioskAndUpdateVerificationLevel(LegacyVerificationLevel.Device)
          }
        />
        <Radio
          value={LegacyVerificationLevel.Document}
          label="Document"
          checked={verificationLevel === LegacyVerificationLevel.Document}
          onChange={() =>
            resetKioskAndUpdateVerificationLevel(
              LegacyVerificationLevel.Document,
            )
          }
        />
      </div>
      <div className="flex flex-row items-center justify-center gap-x-3">
        <Radio
          value={LegacyVerificationLevel.SecureDocument}
          label="Secure Document"
          checked={verificationLevel === LegacyVerificationLevel.SecureDocument}
          onChange={() =>
            resetKioskAndUpdateVerificationLevel(
              LegacyVerificationLevel.SecureDocument,
            )
          }
        />
        <Radio
          value={LegacyVerificationLevel.Orb}
          label="Orb"
          checked={verificationLevel === LegacyVerificationLevel.Orb}
          onChange={() =>
            resetKioskAndUpdateVerificationLevel(LegacyVerificationLevel.Orb)
          }
        />
      </div>
    </div>
  );
});
