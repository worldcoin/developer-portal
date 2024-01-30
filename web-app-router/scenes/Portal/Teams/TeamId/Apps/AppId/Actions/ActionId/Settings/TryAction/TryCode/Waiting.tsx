import { CopyIcon } from "@/components/Icons/CopyIcon";
import QRCode from "react-qr-code";
import clsx from "clsx";
import { memo, useCallback, useState } from "react";

export const Waiting = memo(function Waiting(props: { qrData: string | null }) {
  const [copied, setCopied] = useState(false);
  const { qrData } = props;
  const handleCopy = useCallback(() => {
    if (!qrData) return;

    navigator.clipboard
      .writeText(qrData)
      .then(() => setCopied(true))
      .then(() => new Promise((resolve) => setTimeout(resolve, 3000)))
      .finally(() => setCopied(false));
  }, [qrData]);
  
  return (
    <div className="flex flex-col items-center portrait:py-12 landscape:py-6 bg-white p-10 rounded-2xl gap-y-5 shadow-button">
      {qrData && (
        <QRCode
          size={200}
          className="h-aut max-w-full w-full "
          value={qrData}
        />
      )}
      <button
        onClick={handleCopy}
        className="h-9 font-medium text-14 flex flex-row items-center"
      >
        <CopyIcon
          className={clsx("mr-2 font-[500]", copied && "text-grey-900")}
        />
        {copied ? "Copied!" : "Copy QR code"}
      </button>
    </div>
  );
});
