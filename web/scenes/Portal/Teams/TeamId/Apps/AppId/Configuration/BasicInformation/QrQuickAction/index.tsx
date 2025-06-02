"use client";
import { CopyButton } from "@/components/CopyButton";
import { FlaskIcon } from "@/components/Icons/FlaskIcon";
import { Notification } from "@/components/Notification";
import { QuickAction } from "@/components/QuickAction";
import Image from "next/image";
import QRCode from "qrcode";
import { useEffect, useState } from "react";
import Skeleton from "react-loading-skeleton";

const getQRCode = async (url: string): Promise<string | null> => {
  try {
    return await QRCode.toDataURL(url);
  } catch (error) {
    console.error(error);
    return null;
  }
};

export const QrQuickAction = (props: {
  url: string;
  showDraftMiniAppFlag: boolean;
}) => {
  const { url, showDraftMiniAppFlag } = props;
  const [qrCodeDataURL, setQrCodeDataURL] = useState<string | null>(null);

  useEffect(() => {
    getQRCode(url).then(setQrCodeDataURL);
  }, [url]);

  if (!qrCodeDataURL) {
    return <Skeleton height={200} width={200} />;
  }

  return (
    <div className="grid gap-y-2">
      {showDraftMiniAppFlag && (
        <Notification variant="warning">
          <div className="text-sm">
            <h3 className="font-medium text-yellow-800">Developer Preview</h3>
            <div className="mt-2 text-yellow-700">
              This link/QR code is for testing purposes only and will be deleted
              after the app is verified.
            </div>
          </div>
        </Notification>
      )}
      <div className="flex justify-center">
        <QuickAction
          type="button"
          description="Scan this, or copy the link"
          icon={<FlaskIcon />}
          hideArrow
          iconRight={
            <CopyButton
              fieldName="Miniapp URL"
              fieldValue={url}
              className="flex items-center justify-center rounded-full border p-2 !pr-2 text-blue-500"
            />
          }
          title="See your mini app"
        >
          <Image src={qrCodeDataURL} width={200} height={200} alt="QR Code" />
        </QuickAction>
      </div>
    </div>
  );
};
