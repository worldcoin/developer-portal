import { Switcher } from "@/components/Switch";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import clsx from "clsx";
import { useState } from "react";

export const AppStatus = (props: { disabled?: boolean }) => {
  const { disabled } = props;
  const [enabled, setEnabled] = useState(false);

  return (
    <div className="grid grid-cols-auto/1fr/auto border-[1px] rounded-xl p-5 gap-x-4">
      <Switcher enabled={enabled} setEnabled={setEnabled} disabled={disabled} />
      <div className="grid gap-y-2 ">
        <Typography variant={TYPOGRAPHY.R3}>Activate the QR code</Typography>
        <Typography variant={TYPOGRAPHY.R4} className="text-grey-400">
          Show QR code in your app for users to try it out
        </Typography>
      </div>
      <div
        className={clsx(
          "grid grid-cols-auto/1fr items-center gap-x-1.5 rounded-xl px-3 py-1 h-fit ",
          {
            "text-system-success-500 bg-system-success-50": enabled,
            "text-grey-400 bg-gray-50": !enabled,
          },
        )}
      >
        <div
          className={clsx("rounded-full w-2 h-2", {
            "bg-system-success-500": enabled,
            "bg-grey-400": !enabled,
          })}
        />
        <Typography variant={TYPOGRAPHY.S3}>
          {enabled ? "Active" : "Inactive"}
        </Typography>
      </div>
    </div>
  );
};
