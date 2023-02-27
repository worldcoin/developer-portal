import { internal } from "@worldcoin/idkit";
import cn from "classnames";
import { Icon } from "common/Icon";
import { memo, useCallback, useState } from "react";
import { getKioskStore, useKioskStore } from "../store/kiosk-store";

export const Waiting = memo(function Waiting(props: { appId: string }) {
  const [copied, setCopied] = useState(false);
  const { qrData } = internal.useAppConnection(props.appId, "action");

  const handleCopy = useCallback(() => {
    if (!qrData) return;

    navigator.clipboard
      .writeText(qrData.default)
      .then(() => setCopied(true))
      .then(() => new Promise((resolve) => setTimeout(resolve, 3000)))
      .finally(() => setCopied(false));
  }, [qrData]);

  return (
    <div className="flex flex-col items-center portrait:py-12 landscape:py-6">
      <div className="flex items-center gap-x-6 mb-8 font-rubik font-medium text-16 leading-5">
        <Icon name="spinner" className="w-5 h-5 animate-spin" noMask />
        Waiting for user to scan code with Worldcoin app
      </div>
      <div
        className={cn(
          "flex items-center justify-center relative border border-primary/10 rounded-sm",
          "portrait:w-[395px] landscape:w-[299px] portrait:h-[395px] landscape:h-[299px]",
          "before:absolute before:-top-[1px] before:left-[40px] before:right-[40px] before:-bottom-[1px] before:bg-ffffff",
          "after:absolute after:top-[40px] after:-left-[1px] after:-right-[1px] after:bottom-[40px] after:bg-ffffff"
        )}
      >
        <div className="z-50">
          {qrData && <internal.QRCode data={qrData.default} />}
        </div>
      </div>
      <button
        onClick={handleCopy}
        className="h-9 portrait:mt-8 landscape:mt-4 px-4 font-rubik font-medium text-14 bg-f3f4f5 rounded-lg"
      >
        {copied ? "Copied!" : "Copy QR code"}
      </button>
    </div>
  );
});
