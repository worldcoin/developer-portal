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
};

export const TryAction = (props: TryActionProps) => {
  const { action, is_v4_action, enableKiosk = true } = props;
  const isMiniApp = action.app.app_metadata.some(
    ({ app_mode }) => app_mode === "mini-app",
  );
  const canShowKiosk = enableKiosk && action.app.engine !== EngineType.OnChain;
  const canShowCode = !isMiniApp;
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
        <div className="flex w-full justify-end gap-x-4">
          {canShowKiosk && (
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
          )}
          {canShowCode && (
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
          )}
        </div>
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
        {!showCodeView && !showKioskView && (
          <div className="grid h-full min-h-[400px] items-center rounded-3xl border border-grey-100 bg-grey-50 px-8 text-center">
            <div className="grid gap-y-2">
              <Typography variant={TYPOGRAPHY.M4} className="text-grey-900">
                Mini App integration
              </Typography>
              <Typography variant={TYPOGRAPHY.R4} className="text-grey-500">
                Use MiniKit to integrate this action in your Mini App.
              </Typography>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
