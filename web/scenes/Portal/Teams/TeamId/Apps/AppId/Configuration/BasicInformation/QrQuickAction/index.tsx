"use client";
import { CopyButton } from "@/components/CopyButton";
import { AlertIcon } from "@/components/Icons/AlertIcon";
import { FlaskIcon } from "@/components/Icons/FlaskIcon";
import { QuickAction } from "@/components/QuickAction";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
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
        <div className="flex items-center gap-3 rounded-[10px] bg-system-warning-100 p-5">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-system-warning-600">
            <AlertIcon className="size-4 text-white" />
          </div>
          <div className="flex flex-1 flex-col gap-0.5">
            <Typography
              variant={TYPOGRAPHY.S3}
              className="text-system-warning-600"
            >
              Developer Preview
            </Typography>
            <Typography
              variant={TYPOGRAPHY.B3}
              className="text-system-warning-600"
            >
              This link/QR code is for testing purposes only and will be deleted
              after the app is verified.
            </Typography>
          </div>
        </div>
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
