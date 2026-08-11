"use client";

import { CopyButton } from "@/components/CopyButton";
import { UIModule } from "@/components/AdminDashboard/UIModule";
import QRCode from "react-qr-code";

const MINI_APP_URL = "https://world.org/mini-app";

export const AdminMiniAppQrCard = ({ appId }: { appId: string }) => {
  const shouldRender = appId.length > 0 && !appId.startsWith("app_staging_");

  if (!shouldRender) {
    return null;
  }

  const miniAppUrl = `${MINI_APP_URL}?app_id=${appId}&path=`;

  return (
    <UIModule className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-16 font-semibold text-grey-900">
            Test in World App
          </h2>
          <p className="mt-1 text-12 text-grey-500">
            Scan to open this production Mini App.
          </p>
        </div>

        <CopyButton
          fieldName="Mini App link"
          fieldValue={miniAppUrl}
          className="shrink-0 rounded-8 border border-grey-200 p-2 pr-2! hover:bg-grey-50"
          iconClassName="size-4 text-grey-700"
        />
      </div>

      <div className="mx-auto mt-4 w-full max-w-[200px] rounded-12 border border-grey-200 bg-white p-3">
        <QRCode
          value={miniAppUrl}
          size={176}
          className="h-auto w-full"
          aria-label={`QR code to open ${appId} in World App`}
        />
      </div>
    </UIModule>
  );
};
