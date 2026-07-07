"use client";

import { Button } from "@/components/Button";
import { CodeIcon } from "@/components/Icons/CodeIcon";
import { QRIcon } from "@/components/Icons/QRIcon";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import { EngineType } from "@/lib/types";
import clsx from "clsx";
import { useState } from "react";
import { CodeBlock } from "./CodeBlock";
import { MiniKiosk } from "./MiniKiosk";

type TryActionProps = {
  action: {
    name: string;
    description: string;
    action: string;
    app_id: string;
    app: {
      is_staging: boolean;
      engine: string;
      app_metadata: { app_mode: string }[];
    };
  };
  is_v4_action: boolean;
  enableKiosk?: boolean;
  // When true, render a QR-only tester: hide the code view and its toggle so
  // integration code lives in a single place (e.g. a separate quickstart). The
  // code view still shows as a fallback when the QR kiosk isn't available.
  kioskOnly?: boolean;
};

export const TryAction = (props: TryActionProps) => {
  const { action, is_v4_action, enableKiosk = true, kioskOnly = false } = props;
  const canShowKiosk = enableKiosk && action.app.engine !== EngineType.OnChain;
  // World ID verification for Mini Apps is implemented with @worldcoin/idkit
  // (MiniKit 2.x no longer proxies verification), so the IDKit CodeBlock is the
  // correct integration path for every app type. It's shown for all apps unless
  // the caller opts into a QR-only tester and the kiosk QR is available.
  const canShowCode = !kioskOnly || !canShowKiosk;
  const [showCode, setShowCode] = useState(
    action.app.engine === EngineType.OnChain || !canShowKiosk,
  );
  const showCodeView = canShowCode && (showCode || !canShowKiosk);
  const showKioskView = canShowKiosk && !showCodeView;

  return (
    <div className="grid h-full grid-rows-auto/1fr items-start gap-y-5 lg:w-[480px]">
      <div className="grid w-full grid-cols-2 items-center justify-between">
        <Typography variant={TYPOGRAPHY.M3} className="text-grey-900">
          Try it out
        </Typography>
        {/* Only render the view toggles when there's an actual choice to make;
            a QR-only or code-only tester shows no toggle. */}
        {canShowKiosk && canShowCode && (
          <div className="flex w-full justify-end gap-x-4">
            <Button
              type="button"
              onClick={() => setShowCode(false)}
              className={clsx(
                "flex size-11 items-center justify-center rounded-xl bg-white shadow-button hover:bg-grey-50",
                { "border border-grey-200": showKioskView },
              )}
            >
              <QRIcon
                className={clsx("size-4", {
                  "text-blue-500": showKioskView,
                  "text-grey-700": !showKioskView,
                })}
              />
            </Button>
            <Button
              type="button"
              onClick={() => setShowCode(true)}
              className={clsx(
                "flex size-11 items-center justify-center rounded-xl bg-white shadow-button hover:bg-grey-50",
                { "border border-grey-200": showCodeView },
              )}
            >
              <CodeIcon
                className={clsx("size-4", {
                  "text-blue-500": showCodeView,
                  "text-grey-700": !showCodeView,
                })}
              />
            </Button>
          </div>
        )}
      </div>
      <div className="size-full">
        {showCodeView && (
          <CodeBlock
            appId={action.app_id}
            action_identifier={action.action}
            engine={action.app.engine}
          />
        )}
        {showKioskView && (
          <MiniKiosk action={action} is_v4_action={is_v4_action} />
        )}
      </div>
    </div>
  );
};
