import { CopyIcon } from "@/components/Icons/CopyIcon";
import QRCode from "react-qr-code";
import clsx from "clsx";
import { memo, useCallback, useState } from "react";
import { Button } from "@/components/Button";
import { DecoratedButton } from "@/components/DecoratedButton";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import posthog from "posthog-js";
import { useParams } from "next/navigation";

export const Waiting = memo(function Waiting(props: {
  qrData: string | null;
  showSimulator: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const { qrData, showSimulator } = props;
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
    <div className="grid gap-y-6">
      <div className="flex flex-col items-center portrait:py-12 landscape:py-6 bg-white p-10 rounded-2xl gap-y-5 shadow-qrCode">
        {qrData && (
          <QRCode
            size={180}
            className="h-aut max-w-full w-full "
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
          className="font-medium text-14 flex flex-row items-center"
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
    </div>
  );
});
