import { internal } from "@worldcoin/idkit";
import cn from "classnames";
import { Icon } from "src/common/Icon";
import { Spinner } from "src/common/Spinner";
import { QRCodeSVG } from "qrcode.react";
import { memo, useCallback, useState } from "react";

type QRData = ReturnType<typeof internal.useAppConnection>["qrData"];

export const Waiting = memo(function Waiting(props: {
  appId: string;
  qrData: QRData;
}) {
  const [copied, setCopied] = useState(false);
  console.log("qrData:", props.qrData);

  const handleCopy = useCallback(() => {
    if (!props.qrData) return;

    navigator.clipboard
      .writeText(props.qrData.default)
      .then(() => setCopied(true))
      .then(() => new Promise((resolve) => setTimeout(resolve, 3000)))
      .finally(() => setCopied(false));
  }, [props.qrData]);

  return (
    <div className="flex flex-col items-center portrait:py-12 landscape:py-6">
      <div className="flex items-center gap-x-6 mb-8 font-rubik font-medium text-16 leading-5">
        <Spinner />
        Waiting for user to scan code with Worldcoin app
      </div>
      <div
        className={cn(
          "flex items-center justify-center relative border border-primary/10 rounded-sm",
          "portrait:w-[395px] landscape:w-[300px] portrait:h-[395px] landscape:h-[300px]",
          "before:absolute before:-top-[1px] before:left-[40px] before:right-[40px] before:-bottom-[1px] before:bg-ffffff",
          "after:absolute after:top-[40px] after:-left-[1px] after:-right-[1px] after:bottom-[40px] after:bg-ffffff"
        )}
      >
        <div className="z-50">
          {props.qrData && (
            // <internal.QRCode
            //   data={props.qrData.default}
            //   logoSize={0}
            //   size={600}
            // />
            <QRCodeSVG
              value={props.qrData.default}
              className="portrait:w-[375px] landscape:w-[280px] portrait:h-[375px] landscape:h-[280px]"
            />
          )}
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
