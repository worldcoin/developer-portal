"use client";
import { CopyButton } from "@/components/CopyButton";
import { FlaskIcon } from "@/components/Icons/FlaskIcon";
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

export const QrQuickAction = (props: { app_id: string }) => {
  const { app_id } = props;
  const [qrCodeDataURL, setQrCodeDataURL] = useState<string | null>(null);

  const url = `https://worldcoin.org/mini-app?app_id=${app_id}`;

  useEffect(() => {
    getQRCode(url).then(setQrCodeDataURL);
  }, [url]);

  if (!qrCodeDataURL) {
    return <Skeleton height={200} width={200} />;
  }

  return (
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
  );
};
