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
};

export const TryAction = (props: TryActionProps) => {
  const { action } = props;
  const [showCode, setShowCode] = useState(
    action.app.engine === EngineType.OnChain,
  );

  return (
    <div className="grid h-full grid-rows-auto/1fr items-start gap-y-5 lg:w-[480px]">
      <div className="grid w-full grid-cols-2 items-center justify-between">
        <Typography variant={TYPOGRAPHY.M3} className="text-grey-900">
          Try it out
        </Typography>
        <div className="flex w-full justify-end gap-x-4">
          <Button
            type="button"
            onClick={() => setShowCode(false)}
            className={clsx(
              "flex size-11 items-center justify-center rounded-xl bg-white shadow-button hover:bg-grey-50",
              { "border border-grey-200": !showCode },
              { hidden: action.app.engine === EngineType.OnChain },
            )}
          >
            <QRIcon
              className={clsx("size-4", {
                "text-blue-500": !showCode,
                "text-grey-700": showCode,
              })}
            />
          </Button>
          <Button
            type="button"
            onClick={() => setShowCode(true)}
            className={clsx(
              "flex size-11 items-center justify-center rounded-xl bg-white shadow-button hover:bg-grey-50",
              { "border border-grey-200": showCode },
              {
                hidden: action.app.app_metadata.some(
                  ({ app_mode }) => app_mode === "mini-app",
                ),
              },
            )}
          >
            <CodeIcon
              className={clsx("size-4", {
                "text-blue-500 ": showCode,
                "text-grey-700": !showCode,
              })}
            />
          </Button>
        </div>
      </div>
      <div className="size-full">
        {showCode ? (
          <CodeBlock
            appId={action.app_id}
            action_identifier={action.action}
            engine={action.app.engine}
          />
        ) : (
          <MiniKiosk action={action} />
        )}
      </div>
    </div>
  );
};
