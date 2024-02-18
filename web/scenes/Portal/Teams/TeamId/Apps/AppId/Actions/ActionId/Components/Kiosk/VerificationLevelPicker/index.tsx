import { Radio } from "@/components/Radio";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { VerificationLevel } from "@worldcoin/idkit-core";
import { memo } from "react";
import { twMerge } from "tailwind-merge";

type VerificationLevelPickerProps = {
  verificationLevel: VerificationLevel;
  resetKioskAndUpdateVerificationLevel: (value: VerificationLevel) => void;
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
        "flex flex-row items-center justify-center gap-x-3",
        className,
      )}
    >
      <Typography variant={TYPOGRAPHY.R4} className="text-grey-700">
        Verification level:
      </Typography>
      <Radio
        value={VerificationLevel.Device}
        label="Device"
        checked={verificationLevel === VerificationLevel.Device}
        onChange={() =>
          resetKioskAndUpdateVerificationLevel(VerificationLevel.Device)
        }
      />
      <Radio
        value={VerificationLevel.Orb}
        label="Orb"
        checked={verificationLevel === VerificationLevel.Orb}
        onChange={() =>
          resetKioskAndUpdateVerificationLevel(VerificationLevel.Orb)
        }
      />
    </div>
  );
});
