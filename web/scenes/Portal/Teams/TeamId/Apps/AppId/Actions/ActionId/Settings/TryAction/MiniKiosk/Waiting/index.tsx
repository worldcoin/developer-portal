import { Button } from "@/components/Button";
import { DecoratedButton } from "@/components/DecoratedButton";
import { CopyIcon } from "@/components/Icons/CopyIcon";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import clsx from "clsx";
import { useParams } from "next/navigation";
import posthog from "posthog-js";
import { memo, useCallback, useState } from "react";
import QRCode from "react-qr-code";

export const Waiting = memo(function Waiting(props: {
  qrData: string | null;
  showSimulator: boolean;
  qrCodeSize?: number;
}) {
  const [copied, setCopied] = useState(false);
  const { qrData, showSimulator, qrCodeSize } = props;
  const params = useParams();

  const handleCopy = useCallback(() => {
    if (!qrData) return;

    posthog.capture("mini_kiosk_copied", {
      app_id: params?.appId,
      team_id: params?.teamId,
      action_id: params?.actionId,
    });

    navigator.clipboard
      .writeText(qrData)
      .then(() => setCopied(true))
      .then(() => new Promise((resolve) => setTimeout(resolve, 3000)))
      .finally(() => setCopied(false));
  }, [qrData, params, setCopied]);

  return (
    <div className="grid gap-y-6 p-4">
      <div className="flex flex-col items-center gap-y-5 rounded-[10px] bg-white p-10 shadow-qrCode portrait:py-12 landscape:py-6">
        {qrData && (
          <QRCode
            size={qrCodeSize}
            className="h-auto w-full max-w-full "
            value={qrData}
          />
        )}
        {!qrData && (
          <Typography variant={TYPOGRAPHY.R3}>Loading QR code...</Typography>
        )}
        <Button
          type="button"
          onClick={handleCopy}
          disabled={!qrData}
          className="flex flex-row items-center text-14 font-medium"
        >
          <CopyIcon
            className={clsx("mr-2 font-[500]", copied && "text-grey-900")}
          />
          <Typography variant={TYPOGRAPHY.M3}>
            {copied ? "Copied!" : "Copy QR code"}
          </Typography>
        </Button>
      </div>
      {showSimulator && (
        <DecoratedButton
          href="https://simulator.worldcoin.org/"
          variant="secondary"
          className="w-full py-4"
        >
          <Typography variant={TYPOGRAPHY.M3}>Test in simulator</Typography>
        </DecoratedButton>
      )}
      {!showSimulator && (
        <Typography
          variant={TYPOGRAPHY.M3}
          className="text-center text-grey-700"
        >
          Scan with World App
        </Typography>
      )}
    </div>
  );
});
